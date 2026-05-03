import { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const form = formidable({ maxFileSize: 5 * 1024 * 1024 });
    const [fields, files] = await form.parse(req as any);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) return res.status(400).json({ success: false, error: "No file uploaded" });

    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId as string;
    const inviteId = Array.isArray(fields.inviteId) ? fields.inviteId[0] : fields.inviteId as string;

    if (!userId || !inviteId) {
      return res.status(400).json({ success: false, error: "userId and inviteId required" });
    }

    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;
    const publicUrl = process.env.R2_PUBLIC_URL;

    console.log("R2 ENV CHECK:", {
      hasEndpoint: !!endpoint,
      hasAccessKey: !!accessKeyId,
      hasSecret: !!secretAccessKey,
      hasBucket: !!bucket,
      hasPublicUrl: !!publicUrl,
      endpoint,
      bucket,
    });

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      return res.status(500).json({ 
        success: false, 
        error: "Missing R2 configuration. Check R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET" 
      });
    }

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    const timestamp = Date.now();
    const originalName = file.originalFilename || "image.jpg";
    const safeName = originalName.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const fileName = `users/${userId}/${inviteId}/${timestamp}-${safeName}`;
    const fileContent = fs.readFileSync(file.filepath);

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: fileContent,
      ContentType: file.mimetype || "image/jpeg",
    }));

    const url = publicUrl
      ? `${publicUrl.replace(/\/$/, "")}/${fileName}`
      : `${endpoint}/${bucket}/${fileName}`;

    console.log("Upload success:", url);
    return res.status(200).json({ success: true, url, key: fileName });

  } catch (error: any) {
    console.error("Upload failed:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}