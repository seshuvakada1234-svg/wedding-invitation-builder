import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../src/lib/firebaseAdmin.js";
import { verifyUser } from "../src/lib/auth.js";
import admin from "firebase-admin";
import Razorpay from "razorpay";
import crypto from "crypto";
import { formidable } from "formidable";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

function serializeFirestoreData(data: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
        return [key, value.toDate().toISOString()];
      }
      return [key, value];
    })
  );
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || "";
  const method = req.method || "GET";

  // ── CORS ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
  if (method === "OPTIONS") return res.status(200).end();

  const path = url.split("?")[0];

  try {
    // ── GET /api/health ──
    if (path === "/api/health" && method === "GET") {
      let firestoreStatus = "not_tested";
      try {
        const testRef = adminDb.collection("health_checks").doc("server_boot");
        await testRef.set({ lastCheck: admin.firestore.FieldValue.serverTimestamp() });
        firestoreStatus = "connected";
      } catch (err: any) {
        firestoreStatus = `error: ${err.message}`;
      }
      return res.json({ status: "ok", firestore: firestoreStatus, timestamp: new Date().toISOString() });
    }

    // ── GET /api/config ──
    if (path === "/api/config" && method === "GET") {
      return res.json({
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      });
    }

    // ── GET /api/check-user ──
    if (path === "/api/check-user" && method === "GET") {
      const userId = await verifyUser(req as any);
      const userDoc = await adminDb.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        return res.json({ success: true, paid: data.paid || false, email: data.email || null });
      }
      return res.json({ success: true, paid: false });
    }

    // ── GET /api/get-invites ──
    if (path === "/api/get-invites" && method === "GET") {
      const userId = await verifyUser(req as any);
      const snapshot = await adminDb
        .collection("invites")
        .where("userId", "==", userId)
        .orderBy("updatedAt", "desc")
        .get();
      const invites = snapshot.docs.map((doc) => ({ id: doc.id, ...serializeFirestoreData(doc.data()) }));
      return res.json({ success: true, invites });
    }

    // ── GET /api/get-invite ──
    if (path === "/api/get-invite" && method === "GET") {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, error: "ID required" });
      let inviteDoc = await adminDb.collection("invites").doc(id).get();
      if (!inviteDoc.exists) {
        const snapshot = await adminDb.collection("invites").where("slug", "==", id).limit(1).get();
        if (!snapshot.empty) inviteDoc = snapshot.docs[0];
      }
      if (!inviteDoc.exists) return res.status(404).json({ success: false, error: "Invite not found" });
      if (req.query.increment === "true") {
        await inviteDoc.ref.update({ views: admin.firestore.FieldValue.increment(1) });
      }
      return res.json({ success: true, invite: { id: inviteDoc.id, ...serializeFirestoreData(inviteDoc.data() || {}) } });
    }

    // ── POST /api/save-invite ──
    if (path === "/api/save-invite" && method === "POST") {
      const tokenUserId = await verifyUser(req as any);
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ success: false, error: "ID required" });
      const userDoc = await adminDb.collection("users").doc(tokenUserId).get();
      const isUserPaid = userDoc.exists && userDoc.data()?.paid === true;
      if (!isUserPaid) return res.status(402).json({ success: false, error: "paymentRequired" });
      await adminDb.collection("invites").doc(id).set(
        { ...data, userId: tokenUserId, isPaid: true, slug: id, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      return res.json({ success: true });
    }

    // ── POST /api/create-order ──
    if (path === "/api/create-order" && method === "POST") {
      const keyId = process.env.RAZORPAY_KEY_ID?.trim();
      const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
      if (!keyId || !keySecret) return res.status(500).json({ success: false, error: "Razorpay not configured" });
      const rp = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await rp.orders.create({ amount: 99900, currency: "INR", receipt: `receipt_${Date.now()}` });
      return res.json({ success: true, order });
    }

    // ── POST /api/verify-payment ──
    if (path === "/api/verify-payment" && method === "POST") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, email } = req.body;
      let tokenUserId: string | null = null;
      try { tokenUserId = await verifyUser(req as any); } catch {}
      const confirmedUserId = tokenUserId || userId;
      if (!confirmedUserId) return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
      const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
      if (!key_secret) throw new Error("Razorpay secret missing");
      const hmac = crypto.createHmac("sha256", key_secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      if (hmac.digest("hex") !== razorpay_signature) return res.status(400).json({ success: false, error: "Invalid signature" });
      await adminDb.collection("users").doc(confirmedUserId).set(
        { paid: true, email: email || null, paymentId: razorpay_payment_id, orderId: razorpay_order_id, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      return res.json({ success: true });
    }

    // ── DELETE /api/delete ──
    if (path === "/api/delete" && method === "DELETE") {
      const { key } = req.body;
      if (!key) return res.status(400).json({ success: false, error: "Key required" });
      const client = getR2Client();
      await client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }));
      return res.json({ success: true });
    }

    // ── POST /api/upload ──
    if (path === "/api/upload" && method === "POST") {
      const form = formidable({ maxFileSize: 5 * 1024 * 1024 });
      const [fields, files] = await form.parse(req as any);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return res.status(400).json({ success: false, error: "No file" });
      const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId as string;
      const inviteId = Array.isArray(fields.inviteId) ? fields.inviteId[0] : fields.inviteId as string;
      const timestamp = Date.now();
      const fileName = `users/${userId}/${inviteId}/${timestamp}-${(file.originalFilename || "image.jpg").replace(/[^a-z0-9.]/gi, "_").toLowerCase()}`;
      const client = getR2Client();
      await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: fileName,
        Body: fs.readFileSync(file.filepath),
        ContentType: file.mimetype || "image/jpeg",
      }));
      const publicUrl = process.env.R2_PUBLIC_URL;
      const url = publicUrl ? `${publicUrl.replace(/\/$/, "")}/${fileName}` : `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${fileName}`;
      return res.json({ success: true, url, key: fileName });
    }

    return res.status(404).json({ success: false, error: "Route not found" });

  } catch (error: any) {
    console.error("API error:", error);
    if (error.message === "UNAUTHENTICATED") return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    return res.status(500).json({ success: false, error: error.message });
  }
}