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
        return res.json({ 
          success: true, 
          paid: data.paid || false,
          paidTemplates: data.paidTemplates || {},
          email: data.email || null 
        });
      }
      return res.json({ success: true, paid: false, paidTemplates: {} });
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

    // ── POST /api/save-draft ──
    if (path === "/api/save-draft" && method === "POST") {
      const tokenUserId = await verifyUser(req as any);
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ success: false, error: "ID required" });
      await adminDb.collection("invites").doc(id).set(
        { ...data, userId: tokenUserId, slug: id, published: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      return res.json({ success: true });
    }

    // ── POST /api/save-invite ──
    if (path === "/api/save-invite" && method === "POST") {
      const tokenUserId = await verifyUser(req as any);
      const { id, template: templateFromReq, ...data } = req.body;
      if (!id) return res.status(400).json({ success: false, error: "ID required" });
      
      const userDoc = await adminDb.collection("users").doc(tokenUserId).get();
      const userData = userDoc.data() || {};
      
      const template = (templateFromReq || data.template || "minimal").trim();
      const normalizedTemplate = template.toLowerCase();
      
      // Check if paid for this specific template OR has legacy paid:true
      const isTemplatePaid = userData.paid === true || 
        (userData.paidTemplates && (
          userData.paidTemplates[template] === true || 
          userData.paidTemplates[normalizedTemplate] === true
        )) ||
        userData[`paidTemplates.${template}`] === true ||
        userData[`paidTemplates.${normalizedTemplate}`] === true;
      
      if (!isTemplatePaid) {
        console.error(`Payment check: Fail. User: ${tokenUserId}, Template: ${template}, Normalized: ${normalizedTemplate}, PaidTemplates:`, userData.paidTemplates);
        return res.status(402).json({ 
          success: false, 
          error: "paymentRequired",
          details: { 
            template, 
            userId: tokenUserId,
            paidTemplates: userData.paidTemplates || {}
          }
        });
      }
      
      await adminDb.collection("invites").doc(id).set(
        { ...data, template, userId: tokenUserId, isPaid: true, slug: id, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      return res.json({ success: true });
    }

    // ── POST /api/create-order ──
    if (path === "/api/create-order" && method === "POST") {
      const { templateId } = req.body;
      const keyId = process.env.RAZORPAY_KEY_ID?.trim();
      const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
      if (!keyId || !keySecret) return res.status(500).json({ success: false, error: "Razorpay not configured" });
      
      const TEMPLATE_PRICES: Record<string, number> = {
        "minimal": 49900,
        "housewarming-south": 79900,
        "kerala-wedding": 79900,
        "konaseema": 99900,
        "kerala-envelope-reveal": 129900,
        "royal-wedding": 149900,
      };
      
      const amount = TEMPLATE_PRICES[templateId] || 99900;
      
      const rp = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await rp.orders.create({
        amount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });
      
      return res.json({ success: true, order, amount, templateId });
    }

    // ── POST /api/verify-payment ──
    if (path === "/api/verify-payment" && method === "POST") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, email, templateId } = req.body;
      let tokenUserId: string | null = null;
      try { tokenUserId = await verifyUser(req as any); } catch {}
      const confirmedUserId = tokenUserId || userId;
      if (!confirmedUserId) return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
      const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
      if (!key_secret) throw new Error("Razorpay secret missing");
      const hmac = crypto.createHmac("sha256", key_secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      if (hmac.digest("hex") !== razorpay_signature) return res.status(400).json({ success: false, error: "Invalid signature" });
      
      const userRef = adminDb.collection("users").doc(confirmedUserId);
      
      // Ensure user document exists first
      await userRef.set(
        {
          email: email || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Use update to properly handle nested path for paidTemplates
      const updateData: any = {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // Set nested path for paidTemplates
      if (templateId) {
        const normId = templateId.toString().toLowerCase().trim();
        updateData[`paidTemplates.${normId}`] = true;
        if (normId !== templateId) {
          updateData[`paidTemplates.${templateId}`] = true;
        }
        
        // If they pay for a high-tier template, maybe grant legacy paid:true as well?
        // Or if it's the 'minimal' or 'premium_pass'
        if (normId === "minimal" || normId === "all_access" || normId === "premium") {
          updateData.paid = true;
        }
      } else {
        // If no specifically provided templateId, treat as global paid:true
        updateData.paid = true;
      }
      
      await userRef.update(updateData);

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