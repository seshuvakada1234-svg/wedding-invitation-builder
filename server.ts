import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { formidable } from "formidable";
import fs from "fs";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import admin from "firebase-admin";
import { adminAuth, adminDb } from "./src/lib/firebaseAdmin";
import { verifyUser } from "./src/lib/auth";
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
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT;

    if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
      console.warn("R2 Environment variables missing:", {
        accountId: !!accountId,
        accessKeyId: !!accessKeyId,
        secretAccessKey: !!secretAccessKey,
        endpoint: !!endpoint,
      });
      throw new Error("Missing R2 configuration.");
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

// ─── Server ──────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });

  // JSON body parser — skip for multipart upload
  app.use((req, res, next) => {
    const isUpload =
      (req.path === "/api/upload" || req.url.startsWith("/api/upload?")) &&
      req.method === "POST";
    if (isUpload) return next();
    express.json({ limit: "10mb" })(req, res, next);
  });

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
        const userId = await verifyUser(req);

        // Simple admin check: restrict to your email or an admin collection
        // For now, let's just allow it but log it
        console.log(`Admin access attempt by ${userId}`);

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
      const isUserPaid = userDoc.exists && userDoc.data()?.paid === true;

      // ✅ Payment gate — block save if not paid
      if (!isUserPaid) {
        return res.status(402).json({
          success: false,
          error: "paymentRequired",
          redirect: "/pricing",
        });
      }

      const inviteData = {
        ...data,
        userId: tokenUserId,
        isPaid: true,
        slug: id, // Ensure slug is same as id if not provided
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

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

  // ── Upload ─────────────────────────────────────────────────────────────────
  app.post("/api/upload", async (req, res) => {
    console.log("Processing upload request...");
    try {
      const form = formidable({ maxFileSize: 5 * 1024 * 1024 });
      const [fields, files] = await form.parse(req);
      const client = getR2Client();

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      const userId = Array.isArray(fields.userId) ? fields.userId[0] : (fields.userId as string);
      const inviteId = Array.isArray(fields.inviteId) ? fields.inviteId[0] : (fields.inviteId as string);

      if (!userId || !inviteId) {
        return res.status(400).json({ success: false, error: "userId and inviteId are required" });
      }

      const timestamp = Date.now();
      const originalName = file.originalFilename || "image.jpg";
      const sanitizedFileName = originalName.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
      const fileName = `users/${userId}/${inviteId}/${timestamp}-${sanitizedFileName}`;

      const bucketName = process.env.R2_BUCKET;
      const publicUrl = process.env.R2_PUBLIC_URL;

      if (!bucketName) throw new Error("Missing R2_BUCKET configuration.");

      const fileContent = fs.readFileSync(file.filepath);

      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: fileContent,
          ContentType: file.mimetype || "image/jpeg",
        })
      );

      const url = publicUrl
        ? `${publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl}/${fileName}`
        : `${process.env.R2_ENDPOINT}/${bucketName}/${fileName}`;

      console.log("Upload successful:", url);
      return res.json({ success: true, url, key: fileName });
    } catch (error: any) {
      console.error("DEBUG: Upload failed with error:", error);
      
      // Handle known S3/R2 error cases
      let errorMessage = error.message || "Internal Server Error";
      let statusCode = 500;

      if (error.Code === "EntityTooLarge") {
        errorMessage = "File is too large";
        statusCode = 413;
      } else if (error.name === "CredentialsError") {
        errorMessage = "Cloud storage credentials error";
        statusCode = 500;
      }

      // Ensure status is valid for express
      const finalStatus = typeof error.status === 'number' && error.status >= 100 && error.status < 600 
        ? error.status 
        : statusCode;

      return res.status(finalStatus).json({
        success: false,
        error: errorMessage,
      });
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
          email: data.email || null 
        });
      }
      res.json({ success: true, paid: false });
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

  // ── Create Razorpay Order ──────────────────────────────────────────────────
  app.post("/api/create-order", async (req, res) => {
    try {
      console.log("POST /api/create-order received");
      const rp = getRazorpay();
      if (!rp) {
        return res.status(500).json({
          success: false,
          error: "Razorpay keys not configured. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        });
      }

      const order = await rp.orders.create({
        amount: 99900, // ₹999.00
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      console.log("Order created:", order.id);
      res.json({ success: true, order });
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
        await db.collection("users").doc(confirmedUserId).set(
          {
            paid: true,
            email: email || null,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        console.log("Payment verified and saved for user:", confirmedUserId);
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
