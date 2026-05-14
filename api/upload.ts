import { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,   // MUST stay false — formidable needs raw stream
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // ── DEBUG: log what the server actually received ──────────────────────
    console.log("=== /api/upload called ===");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Content-Length:", req.headers["content-length"]);
    console.log("Transfer-Encoding:", req.headers["transfer-encoding"]);

    // Guard: if Content-Type is application/json, the FormData boundary is
    // gone and formidable will find nothing. Catch it early.
    const ct = req.headers["content-type"] || "";
    if (ct.includes("application/json")) {
      console.error("WRONG Content-Type: received application/json — FormData not sent correctly by the client.");
      return res.status(400).json({
        success: false,
        error: "Upload must use multipart/form-data, not application/json. Do not set Content-Type manually.",
      });
    }

    // ── Parse multipart form ──────────────────────────────────────────────
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,   // 10 MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req as any);

    // ── DEBUG: log parsed results ─────────────────────────────────────────
    console.log("Fields received:", Object.keys(fields));
    console.log("Files received:", Object.keys(files));
    console.log(
      "File keys detail:",
      Object.entries(files).map(([k, v]) => ({
        key: k,
        isArray: Array.isArray(v),
        length: Array.isArray(v) ? v.length : 1,
        filename: Array.isArray(v) ? v[0]?.originalFilename : (v as any)?.originalFilename,
        mimetype: Array.isArray(v) ? v[0]?.mimetype : (v as any)?.mimetype,
        size: Array.isArray(v) ? v[0]?.size : (v as any)?.size,
      }))
    );

    // Accept any of these field names for the file
    const fileEntry =
      files.file ||
      files.image ||
      files.photo ||
      files.coverImage ||
      files.gallery;

    const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;

    if (!file) {
      console.error("No file found in parsed form. Full files object:", JSON.stringify(files));
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Ensure FormData uses field name 'file' and Content-Type is NOT set manually.",
      });
    }

    // ── Validate required fields ──────────────────────────────────────────
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : (fields.userId as string);
    const inviteId = Array.isArray(fields.inviteId) ? fields.inviteId[0] : (fields.inviteId as string);

    if (!userId || !inviteId) {
      console.error("Missing userId or inviteId. Fields:", fields);
      return res.status(400).json({
        success: false,
        error: "userId and inviteId are required fields in the form.",
      });
    }

    // ── R2 config ─────────────────────────────────────────────────────────
    const clean = (val: string | undefined) =>
      val?.trim().replace(/^["'](.+)["']$/, "$1");

    const endpoint      = clean(process.env.R2_ENDPOINT);
    const accessKeyId   = clean(process.env.R2_ACCESS_KEY_ID);
    const secretAccessKey = clean(process.env.R2_SECRET_ACCESS_KEY);
    const bucket        = clean(process.env.R2_BUCKET);
    const publicUrlBase = clean(process.env.R2_PUBLIC_URL)?.replace(/\/$/, "");

    console.log("R2 config check:", {
      hasEndpoint:   !!endpoint,
      hasAccessKey:  !!accessKeyId,
      hasSecret:     !!secretAccessKey,
      hasBucket:     !!bucket,
      hasPublicUrl:  !!publicUrlBase,
      bucket,
    });

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      return res.status(500).json({
        success: false,
        error: "Missing R2 configuration. Check R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in environment variables.",
      });
    }

    // ── Upload to R2 ──────────────────────────────────────────────────────
    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    const timestamp    = Date.now();
    const originalName = file.originalFilename || "image.jpg";
    const safeName     = originalName.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const key          = `users/${userId}/${inviteId}/${timestamp}-${safeName}`;
    const fileBuffer   = fs.readFileSync(file.filepath);

    await client.send(
      new PutObjectCommand({
        Bucket:      bucket,
        Key:         key,
        Body:        fileBuffer,
        ContentType: file.mimetype || "image/jpeg",
      })
    );

    const url = publicUrlBase
      ? `${publicUrlBase}/${key}`
      : `${endpoint}/${bucket}/${key}`;

    console.log("Upload success:", url);
    return res.status(200).json({ success: true, url, key });

  } catch (error: any) {
    console.error("Upload handler error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during upload.",
    });
  }
}