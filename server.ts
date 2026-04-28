import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize R2 client lazily to prevent crash if env vars are missing at startup
let r2: S3Client | null = null;

function getR2Client() {
  if (!r2) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const customEndpoint = process.env.R2_ENDPOINT;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("Missing R2 configuration (AccountID, AccessKey, or SecretKey). Please check your environment variables.");
    }

    r2 = new S3Client({
      region: "auto",
      endpoint: customEndpoint || `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Body parser for JSON
  app.use(express.json());

  // Use memory storage for multer
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // API Route for upload
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    console.log("Upload request received");
    try {
      const client = getR2Client();
      
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ success: false, error: "Only images allowed" });
      }

      const { userId, inviteId } = req.body;
      if (!userId || !inviteId) {
        return res.status(400).json({ success: false, error: "userId and inviteId are required" });
      }

      const timestamp = Date.now();
      const sanitizedFileName = req.file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const fileName = `users/${userId}/${inviteId}/${timestamp}-${sanitizedFileName}`;
      
      const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET;
      const publicUrl = process.env.R2_PUBLIC_URL;

      if (!bucketName || !publicUrl) {
        throw new Error("Missing R2 Bucket Name or Public URL configuration.");
      }

      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      const url = `${publicUrl}/${fileName}`;
      console.log(`Upload successful: ${url}`);
      res.json({ success: true, url, key: fileName });
    } catch (error) {
      console.error("Upload error details:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal Server Error" 
      });
    }
  });

  // API Route for delete
  app.delete("/api/delete", async (req, res) => {
    console.log("Delete request received");
    try {
      const client = getR2Client();
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({ success: false, error: "File key is required" });
      }

      const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET;
      if (!bucketName) {
        throw new Error("Missing R2 Bucket Name configuration.");
      }

      await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal Server Error" 
      });
    }
  });

  // Catch-all for other /api routes to ensure they return JSON instead of HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ success: false, error: "API route not found" });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
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
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
