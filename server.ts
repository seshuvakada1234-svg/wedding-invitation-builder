import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import formidable from "formidable";
import fs from "fs";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import admin from "firebase-admin";
import { adminAuth, adminDb } from "./src/lib/firebaseAdmin.js";
import { verifyUser, verifyAdmin } from "./src/lib/authServer.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Auth Token Verification (Helper already in src/lib/auth.ts) ────────────

function getAdminDb() {
  return adminDb;
}

// ─── Razorpay Init ──────────────────────────────────────────────────────────

let razorpay: Razorpay | null = null;

function getRazorpay() {
  if (!razorpay) {
    let keyId = process.env.RAZORPAY_KEY_ID?.trim().replace(/^["'](.+)["']$/, "$1");
    let keySecret = process.env.RAZORPAY_KEY_SECRET?.trim().replace(/^["'](.+)["']$/, "$1");

    console.log("RAZORPAY INIT ATTEMPT:");
    console.log("- KEY_ID:", keyId ? `${keyId.substring(0, 8)}... (length: ${keyId.length})` : "MISSING");
    console.log("- KEY_SECRET:", keySecret ? `*** (length: ${keySecret.length})` : "MISSING");

    if (!keyId || !keySecret) {
      console.error("RAZORPAY CONFIG ERROR: KEY_ID or KEY_SECRET missing.");
      return null;
    }

    if (!keyId.startsWith("rzp_")) {
      console.warn("RAZORPAY WARNING: Key ID does not start with 'rzp_'.");
    }

    try {
      razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      console.log("Razorpay initialized successfully.");
    } catch (err: any) {
      console.error("Razorpay constructor failed:", err.message);
      return null;
    }
  }
  return razorpay;
}

// ─── R2 Client Init ─────────────────────────────────────────────────────────

let r2: S3Client | null = null;

function getR2Client() {
  if (!r2) {
    const accountId = process.env.R2_ACCOUNT_ID?.trim().replace(/^["'](.+)["']$/, "$1");
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim().replace(/^["'](.+)["']$/, "$1");
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim().replace(/^["'](.+)["']$/, "$1");
    const endpoint = process.env.R2_ENDPOINT?.trim().replace(/^["'](.+)["']$/, "$1");

    if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
      console.warn("R2 Environment variables missing or invalid:", {
        accountId: !!accountId,
        accessKeyId: !!accessKeyId,
        secretAccessKey: !!secretAccessKey,
        endpoint: !!endpoint,
      });
      throw new Error("Missing or invalid R2 configuration.");
    }

    r2 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return r2;
}

// ─── Firestore Timestamp Serializer ─────────────────────────────────────────

function serializeFirestoreData(data: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (
        value &&
        typeof value === "object" &&
        "toDate" in value &&
        typeof value.toDate === "function"
      ) {
        return [key, value.toDate().toISOString()];
      }
      return [key, value];
    })
  );
}

function calculateFreeViews(price: number) {
  if (price >= 9999) return 10000;
  if (price >= 4999) return 5000;
  if (price >= 1999) return 2000;
  if (price >= 1499) return 1500;
  if (price >= 999) return 1000;
  return 500;
}

/**
 * Normalizes image fields in the invitation data to ensure they use public CDN URLs.
 * Detects blob URLs or broken internal storage paths and replaces them with public ones if possible.
 */
function normalizeInvitationImages(data: any): any {
  if (!data) return data;
  
  const publicUrl = (process.env.R2_PUBLIC_URL || "").trim().replace(/^["'](.+)["']$/, "$1").replace(/\/$/, "");
  
  const fixUrl = (val: any): any => {
    if (val === undefined || val === null) return val;
    
    // If it's an EditableImage object
    if (typeof val === "object" && val.url) {
      return { ...val, url: fixUrl(val.url) };
    }
    
    // If it's a string URL
    if (typeof val === "string") {
      let trimmed = val.trim();
      
      // 1. Detect blob URLs - these are broken for public users
      if (trimmed.startsWith("blob:")) return null; 
      
      // 2. Detect local/development paths
      if (trimmed.startsWith("http://localhost") || trimmed.startsWith("http://127.0.0.1")) return null;
      
      // 3. Fix internal R2 endpoint URLs to use public CDN if available
      const r2Endpoint = (process.env.R2_ENDPOINT || "").trim().replace(/^["'](.+)["']$/, "$1");
      const bucket = (process.env.R2_BUCKET || "").trim().replace(/^["'](.+)["']$/, "$1");
      
      if (publicUrl && (trimmed.includes(r2Endpoint) || trimmed.includes(".r2.cloudflarestorage.com"))) {
        const urlParts = trimmed.split("/");
        const usersIndex = urlParts.indexOf("users");
        if (usersIndex !== -1) {
          const key = urlParts.slice(usersIndex).join("/");
          return `${publicUrl}/${key}`;
        }
      }
      return trimmed;
    }
    return val;
  };

  const newData = { ...data };
  
  if (newData.coverImage) newData.coverImage = fixUrl(newData.coverImage);
  if (newData.image) newData.image = fixUrl(newData.image);
  
  if (Array.isArray(newData.galleryImages)) {
    newData.galleryImages = newData.galleryImages.map(fixUrl);
  }
  
  if (Array.isArray(newData.events)) {
    newData.events = newData.events.map((ev: any) => ({
      ...ev,
      image: fixUrl(ev.image)
    }));
  }
  
  if (newData.publishedData) {
    newData.publishedData = normalizeInvitationImages(newData.publishedData);
  }
  
  if (newData.draftData) {
    newData.draftData = normalizeInvitationImages(newData.draftData);
  }

  return newData;
}

/**
 * Recursively removes undefined values from an object or array to prevent Firestore crashes.
 */
function sanitizeFirestoreData(data: any): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item));
  }
  
  const sanitized: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (key === 'image' && (value === undefined || value === null)) {
        sanitized[key] = "";
        continue;
      }
      
      if (value !== undefined) {
        sanitized[key] = sanitizeFirestoreData(value);
      } else {
        sanitized[key] = null;
      }
    }
  }
  return sanitized;
}

// ─── Server ──────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ── Upload handler (using formidable) ───────────────────────────────────
  app.post("/api/upload", async (req, res) => {
    console.log("POST /api/upload started");
    try {
      const form = formidable({
        maxFileSize: 50 * 1024 * 1024,
        maxTotalFileSize: 50 * 1024 * 1024,
        allowEmptyFiles: false,
      });

      const [fields, files] = await form.parse(req);
      
      const uploadedFile = files.file || files.image || files.photo || files.coverImage || files.gallery;
      const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
      
      if (!file) {
        console.error("FILES RECEIVED:", files);
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;
      const inviteId = Array.isArray(fields.inviteId) ? fields.inviteId[0] : fields.inviteId;

      if (!userId || !inviteId) {
        return res.status(400).json({ success: false, error: "userId and inviteId are required" });
      }

      const client = getR2Client();
      const timestamp = Date.now();
      const originalFileName = file.originalFilename || "image.jpeg";
      const sanitizedFileName = originalFileName.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
      const fileName = `users/${userId}/${inviteId}/${timestamp}-${sanitizedFileName}`;

      const bucketName = process.env.R2_BUCKET?.trim().replace(/^["'](.+)["']$/, "$1");
      const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/^["'](.+)["']$/, "$1");

      if (!bucketName) throw new Error("Missing R2_BUCKET configuration.");

      const fileBuffer = fs.readFileSync(file.filepath);

      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: fileBuffer,
          ContentType: file.mimetype || "image/jpeg",
        })
      );
      
      const url = publicUrl
        ? `${publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl}/${fileName}`
        : `${process.env.R2_ENDPOINT?.trim().replace(/^["'](.+)["']$/, "$1")}/${bucketName}/${fileName}`;

      console.log("Upload success:", url);
      return res.json({ success: true, url, key: fileName });
    } catch (error: any) {
      console.error("DEBUG: Upload failed:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal Server Error",
      });
    }
  });

  // JSON body parser — skip for already handled upload
  app.use(express.json({ limit: "50mb" }));

    // ── Get User Invites ──────────────────────────────────────────────────────
    app.get("/api/get-invites", async (req, res) => {
      try {
        const userId = await verifyUser(req);

        const db = getAdminDb();
        if (!db) throw new Error("DB not initialized");

        const snapshot = await db
          .collection("invites")
          .where("userId", "==", userId)
          .orderBy("updatedAt", "desc")
          .get();

        const invites = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...serializeFirestoreData(doc.data()),
        }));

        res.json({ success: true, invites });
      } catch (error: any) {
        console.error("Get invites error:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ── Get Single Invite ─────────────────────────────────────────────────────
    app.get("/api/get-invite", async (req, res) => {
      try {
        const id = req.query.id as string;
        if (!id) return res.status(400).json({ success: false, error: "ID required" });

        const db = getAdminDb();
        if (!db) throw new Error("DB not initialized");

        // Try direct doc ID first
        let inviteDoc = await db.collection("invites").doc(id).get();

        // Fallback to slug search
        if (!inviteDoc.exists) {
          const snapshot = await db
            .collection("invites")
            .where("slug", "==", id)
            .limit(1)
            .get();
          if (!snapshot.empty) {
            inviteDoc = snapshot.docs[0];
          }
        }

        if (!inviteDoc.exists) {
          return res.status(404).json({ success: false, error: "Invite not found" });
        }

        const data = serializeFirestoreData(inviteDoc.data() || {});
        
        // ✅ Enforce view limits
        const currentViews = data.views || 0;
        const freeViews = data.freeViews || 500;
        const viewLimit = data.viewLimit || freeViews;
        
        if (currentViews >= viewLimit && req.query.increment === "true") {
           // Flag it as exceeded
           console.log(`View limit reached for ${id}: ${currentViews}/${viewLimit}`);
           return res.json({ 
             success: true, 
             invite: { id: inviteDoc.id, ...data, limitExceeded: true } 
           });
        }

        // Increment views if not in edit mode (optional check)
        if (req.query.increment === "true") {
          await inviteDoc.ref.update({
            views: admin.firestore.FieldValue.increment(1)
          });
        }

        res.json({ success: true, invite: { id: inviteDoc.id, ...data } });
      } catch (error: any) {
        console.error("Get invite error:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ── Admin: All Invites ────────────────────────────────────────────────────
    app.get("/api/admin/all-invites", async (req, res) => {
      try {
        const userId = await verifyAdmin(req);
        console.log(`Admin access granted to ${userId}`);

        const db = getAdminDb();
        if (!db) throw new Error("DB not initialized");

        const snapshot = await db.collection("invites").orderBy("updatedAt", "desc").limit(50).get();
        const invites = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...serializeFirestoreData(doc.data()),
        }));

        res.json({ success: true, invites });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ── Admin: Delete Invite ──────────────────────────────────────────────────
    app.delete("/api/admin/invite/:id", async (req, res) => {
      try {
        await verifyAdmin(req);
        const { id } = req.params;
        const db = getAdminDb();
        if (!db) throw new Error("DB error");

        await db.collection("invites").doc(id).delete();
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ── Admin: Unpublish Invite ───────────────────────────────────────────────
    app.patch("/api/admin/invite/:id/unpublish", async (req, res) => {
      try {
        await verifyAdmin(req);
        const { id } = req.params;
        const db = getAdminDb();
        if (!db) throw new Error("DB error");

        await db.collection("invites").doc(id).update({
          isPaid: false,
          published: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

  // ── Save Invite ────────────────────────────────────────────────────────────
  app.post("/api/save-invite", async (req, res) => {
    console.log("Save invite request received");
    try {
      // ✅ Verify auth token
      const tokenUserId = await verifyUser(req);

      const { id, ...data } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: "Invitation ID is required" });
      }

      const db = getAdminDb();
      if (!db) {
        return res.status(503).json({
          success: false,
          error: "Database configuration error.",
          code: "DB_INIT_ERROR",
        });
      }

      // ✅ Use verified token userId, not body userId
      const userDoc = await db.collection("users").doc(tokenUserId).get();
      const userData = userDoc.data() || {};
      
      const template = (req.body.template || data.template || "minimal").toString().trim();
      const normalizedTemplate = template.toLowerCase();

      // ✅ Payment gate — block save if not paid for this template
      const isUserPaid = userData.paid === true || 
        (userData.paidTemplates && (
          userData.paidTemplates[template] === true || 
          userData.paidTemplates[normalizedTemplate] === true
        )) ||
        userData[`paidTemplates.${template}`] === true ||
        userData[`paidTemplates.${normalizedTemplate}`] === true;

      // ✅ Payment gate — block save if not paid
      if (!isUserPaid) {
        console.error(`Payment check: Fail in server.ts. User: ${tokenUserId}, Template: ${template}, Normalized: ${normalizedTemplate}, PaidTemplates:`, userData.paidTemplates);
        return res.status(402).json({
          success: false,
          error: "paymentRequired",
          details: { template, userId: tokenUserId },
          redirect: "/pricing",
        });
      }

      const normalizedSaveData = normalizeInvitationImages(data);
      const sanitizedData = sanitizeFirestoreData(normalizedSaveData);

      const inviteData: any = {
        ...sanitizedData,
        template,
        userId: tokenUserId,
        isPaid: true,
        slug: id, // Ensure slug is same as id if not provided
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // ✅ Dynamically ensure freeViews if not already set or if template changed
      try {
        const templateDoc = await db.collection("templates").doc(template).get();
        if (templateDoc.exists) {
          const tData = templateDoc.data();
          const price = Number(tData?.publishPrice || 499);
          inviteData.templatePrice = price;
          // Only update if it doesn't exist or if we want to ensure it's synced with the current template price
          // For now, let's always sync it to keep it simple and fair
          inviteData.freeViews = calculateFreeViews(price);
        } else {
           // Fallback to default if template doc missing
           inviteData.freeViews = 500;
        }
      } catch (e) {
        console.warn("Error auto-setting freeViews during save:", e);
      }

      await db.collection("invites").doc(id).set(inviteData, { merge: true });
      res.json({ success: true });
    } catch (error) {
      console.error("Save invite error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  });

  // ── Save Draft ─────────────────────────────────────────────────────────────
  app.post("/api/save-draft", async (req, res) => {
    try {
      const tokenUserId = await verifyUser(req);
      const { id, ...data } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: "Invitation ID is required" });
      }

      const db = getAdminDb();
      if (!db) {
        return res.status(503).json({ success: false, error: "Database configuration error." });
      }

      const normalizedData = normalizeInvitationImages(data);
      const sanitizedData = sanitizeFirestoreData(normalizedData);

      const inviteData: any = {
        ...sanitizedData,
        userId: tokenUserId,
        slug: id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("invites").doc(id).set(inviteData, { merge: true });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Save draft error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  app.delete("/api/delete", async (req, res) => {
    console.log("Delete request received");
    try {
      const client = getR2Client();
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({ success: false, error: "File key is required" });
      }

      const bucketName = process.env.R2_BUCKET;
      if (!bucketName) throw new Error("Missing R2_BUCKET configuration.");

      await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  });

  // ── Check User ─────────────────────────────────────────────────────────────
  app.get("/api/check-user", async (req, res) => {
    try {
      // ✅ Use verifyUser middleware
      const userId = await verifyUser(req);
      
      console.log("Checking status for user:", userId);
      const db = getAdminDb();
      if (!db) {
        return res.status(503).json({ success: false, error: "DB_INIT_ERROR" });
      }

      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        return res.json({ 
          success: true, 
          paid: data.paid || false,
          paidTemplates: data.paidTemplates || {},
          email: data.email || null 
        });
      }
      res.json({ success: true, paid: false, paidTemplates: {} });
    } catch (error: any) {
      console.error("Check user error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── User Status ────────────────────────────────────────────────────────────
  app.get("/api/user-status", async (req, res) => {
    try {
      // ✅ Try token-based auth
      let userId: string | null = null;
      try {
        userId = await verifyUser(req);
      } catch {
        userId = req.query.userId as string;
      }

      if (!userId || userId === "undefined") {
        return res.json({ success: true, paid: false, message: "No userId provided" });
      }

      console.log("Checking user-status for:", userId);
      const db = getAdminDb();
      if (!db) {
        return res.status(503).json({
          success: false,
          error: "Database configuration error.",
          code: "DB_INIT_ERROR",
        });
      }

      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const data = serializeFirestoreData(userDoc.data() || {});
        return res.json({ success: true, ...data });
      }
      res.json({ success: true, paid: false });
    } catch (error: any) {
      console.error("User status error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── Create Top-Up Order ────────────────────────────────────────────────────
  app.post("/api/create-topup-order", async (req, res) => {
    try {
      const { inviteId } = req.body;
      const rp = getRazorpay();
      if (!rp) return res.status(503).json({ success: false, error: "Razorpay error" });

      const amount = 9900; // ₹99 for 1000 views

      const order = await rp.orders.create({
        amount,
        currency: "INR",
        receipt: `topup_${Date.now()}`,
      });

      res.json({ success: true, order, amount });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── Verify Top-Up Payment ──────────────────────────────────────────────────
  app.post("/api/verify-topup-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, inviteId } = req.body;
      const userId = await verifyUser(req);
      const db = getAdminDb();
      if (!db) return res.status(503).json({ success: false, error: "DB error" });

      const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim().replace(/^["'](.+)["']$/, "$1");
      const hmac = crypto.createHmac("sha256", key_secret || "");
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      if (hmac.digest("hex") !== razorpay_signature) {
        return res.status(400).json({ success: false, error: "Invalid signature" });
      }

      const inviteRef = db.collection("invites").doc(inviteId);
      const inviteSnap = await inviteRef.get();
      if (!inviteSnap.exists) return res.status(404).json({ success: false, error: "Invite not found" });

      const currentLimit = inviteSnap.data()?.viewLimit || inviteSnap.data()?.freeViews || 500;
      await inviteRef.update({
        viewLimit: currentLimit + 1000,
        limitExceeded: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── Create Redeploy Order ──────────────────────────────────────────────────
  app.post("/api/create-redeploy-order", async (req, res) => {
    try {
      const rp = getRazorpay();
      if (!rp) return res.status(503).json({ success: false, error: "Razorpay error" });

      const amount = 9900; // ₹99 redeploy fee

      const order = await rp.orders.create({
        amount,
        currency: "INR",
        receipt: `redeploy_${Date.now()}`,
      });

      res.json({ success: true, order, amount });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── Verify Redeploy Payment ────────────────────────────────────────────────
  app.post("/api/verify-redeploy-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, inviteId } = req.body;
      const userId = await verifyUser(req);
      const db = getAdminDb();
      if (!db) return res.status(503).json({ success: false, error: "DB error" });

      const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim().replace(/^["'](.+)["']$/, "$1");
      const hmac = crypto.createHmac("sha256", key_secret || "");
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      if (hmac.digest("hex") !== razorpay_signature) {
        return res.status(400).json({ success: false, error: "Invalid signature" });
      }

      const inviteRef = db.collection("invites").doc(inviteId);
      const inviteSnap = await inviteRef.get();
      if (!inviteSnap.exists) return res.status(404).json({ success: false, error: "Invite not found" });

      await inviteRef.update({
        hasUnpublishedChanges: false,
        lastPublishedAt: admin.firestore.FieldValue.serverTimestamp(),
        redeployCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── Create Razorpay Order ──────────────────────────────────────────────────
  app.post("/api/create-order", async (req, res) => {
    try {
      console.log("POST /api/create-order received");
      const { templateId } = req.body;
      const rp = getRazorpay();
      if (!rp) {
        return res.status(500).json({
          success: false,
          error: "Razorpay keys not configured. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        });
      }

      // Default fallback prices if DB lookup fails
      const DEFAULT_PRICES: Record<string, number> = {
        "minimal": 499,
        "housewarming-south": 799,
        "kerala-wedding": 799,
        "konaseema": 999,
        "kerala-envelope-reveal": 1299,
        "royal-wedding": 1499,
        "all_access": 1999,
      };
      
      let amountInRupees = DEFAULT_PRICES[templateId] || 499;

      // ✅ Fetch dynamic price from Firestore and check if template is enabled
      const db = getAdminDb();
      if (db) {
        const templateDoc = await db.collection("templates").doc(templateId).get();
        if (templateDoc.exists) {
          const data = templateDoc.data();
          
          // Check if template is disabled
          if (data?.enabled === false) {
            return res.status(403).json({
              success: false,
              error: "This template is currently unavailable. Please choose another one.",
              code: "TEMPLATE_DISABLED"
            });
          }

          if (data?.publishPrice) {
            amountInRupees = Number(data.publishPrice);
            console.log(`Dynamic price fetched for ${templateId}: ₹${amountInRupees}`);
          }
        } else {
           console.warn(`Template document ${templateId} not found in Firestore. Using default price: ₹${amountInRupees}`);
        }
      }

      const amountInPaise = Math.round(amountInRupees * 100);

      const order = await rp.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      console.log("Order created:", order.id, "for template:", templateId);
      res.json({ success: true, order, amount: amountInPaise, templateId });
    } catch (error: any) {
      console.error("Create order error:", error.message || error);

      let errorMsg = "Failed to create payment order";
      if (error?.error?.description) errorMsg = error.error.description;
      else if (error?.message) errorMsg = error.message;

      if (errorMsg.includes("Authentication failed") || error?.error?.code === "BAD_REQUEST_ERROR") {
        errorMsg = "Razorpay Authentication Failed: Check KEY_ID and KEY_SECRET.";
      }

      res.status(500).json({
        success: false,
        error: errorMsg,
        code: error?.code || error?.error?.code || "PAYMENT_INIT_ERROR",
      });
    }
  });

  // ── Verify Payment ─────────────────────────────────────────────────────────
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId,
        email,
        templateId
      } = req.body;

      // 1. Authenticate user
      let tokenUserId: string | null = null;
      try {
        tokenUserId = await verifyUser(req);
      } catch (e) {
        // Fallback for payment if needed, but safer to require auth
        console.warn("Payment verification auth missing token");
      }
      
      const confirmedUserId = tokenUserId || userId;

      if (!confirmedUserId) {
        return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
      }

      // 2. Clear credentials and verify signature
      const clean = (val: string | undefined) => val?.trim().replace(/^["'](.+)["']$/, "$1");
      const key_secret = clean(process.env.RAZORPAY_KEY_SECRET);
      if (!key_secret) throw new Error("Razorpay secret missing from server environment.");

      const hmac = crypto.createHmac("sha256", key_secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generated_signature = hmac.digest("hex");

      if (generated_signature !== razorpay_signature) {
        console.error("Signature Mismatch!");
        return res.status(400).json({ success: false, error: "Invalid payment signature" });
      }

      const db = getAdminDb();
      if (db) {
        const userRef = db.collection("users").doc(confirmedUserId);
        
        // Ensure user exists first
        await userRef.set({
          email: email || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        const updateData: any = {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        let paymentAmount = 499; // Default factor
        
        // ✅ Fetch dynamic price for analytics
        try {
           const templateDoc = await db.collection("templates").doc(templateId).get();
           if (templateDoc.exists) {
              const tData = templateDoc.data();
              if (tData?.publishPrice) {
                paymentAmount = Number(tData.publishPrice);
              }
           }
        } catch (ePrice) {
           console.warn("Failed to fetch price for analytics verification:", ePrice);
        }

        if (templateId) {
          const normId = templateId.toString().toLowerCase().trim();
          updateData[`paidTemplates.${normId}`] = true;
          // Also set the original just in case
          if (normId !== templateId) {
            updateData[`paidTemplates.${templateId}`] = true;
          }

          if (normId === "minimal" || normId === "all_access" || normId === "premium") {
            updateData.paid = true;
          }
        } else {
          updateData.paid = true;
        }

        await userRef.update(updateData);

        // ✅ Update any active invites with this template to have the new freeViews limit
        try {
          const freeViews = calculateFreeViews(paymentAmount);
          const invitesSnapshot = await db.collection("invites")
            .where("userId", "==", confirmedUserId)
            .where("template", "==", templateId)
            .get();
          
          const batch = db.batch();
          invitesSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { 
              templatePrice: paymentAmount,
              freeViews: freeViews,
              // currentViews is already incremented by the visitor logic
            });
          });
          await batch.commit();
        } catch (eInvites) {
           console.error("Error updating invite freeViews:", eInvites);
        }

        // ✅ Create detailed payment record for analytics
        await db.collection("payments").add({
          userId: confirmedUserId,
          email: email || null,
          templateId: templateId || "minimal",
          amount: paymentAmount,
          status: "paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("Payment verified and saved for user:", confirmedUserId, "Template:", templateId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Verify payment error:", error);
      res.status(500).json({ success: false, error: "Payment verification failed" });
    }
  });

  // ── Health Check ───────────────────────────────────────────────────────────
  app.get("/api/health", async (req, res) => {
    let firestoreStatus = "not_tested";
    try {
      const db = getAdminDb();
      if (db) {
        // Simple write/delete test to verify full write access
        const testRef = db.collection("health_checks").doc("server_boot");
        await testRef.set({ lastCheck: admin.firestore.FieldValue.serverTimestamp() });
        firestoreStatus = "connected";
      } else {
        firestoreStatus = "initialization_failed";
      }
    } catch (err: any) {
      console.error("Firestore health check failed:", err);
      firestoreStatus = `error: ${err.message || String(err)}`;
    }

    res.json({
      status: "ok",
      firestore: firestoreStatus,
      timestamp: new Date().toISOString()
    });
  });

  // ── Config ─────────────────────────────────────────────────────────────────
  app.get("/api/config", (req, res) => {
    res.json({
      razorpayKeyId:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  });

  // ── Global Error Handler ───────────────────────────────────────────────────
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Express Error Handler:", err);
    
    if (err.message === "UNAUTHENTICATED") {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }

    if (err.message === "UNAUTHORIZED") {
      return res.status(403).json({ success: false, error: "UNAUTHORIZED" });
    }

    const status = typeof err.status === 'number' && err.status >= 100 && err.status < 600 
      ? err.status 
      : 500;
    res.status(status).json({
      success: false,
      error: err.message || "Internal Server Error",
    });
  });

  // ── 404 for unknown API routes ─────────────────────────────────────────────
  app.all("/api/*", (req, res) => {
    res.status(404).json({ success: false, error: "API route not found" });
  });

  // ── Vite / Static ──────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return app;
}

const appPromise = startServer().catch(e => console.error("Server start error:", e));

export default appPromise;