import { IncomingForm } from 'formidable';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';

// Vercel config to disable body parsing for formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Form parsing error' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;
    const inviteId = Array.isArray(fields.inviteId) ? fields.inviteId[0] : fields.inviteId;

    if (!userId || !inviteId) {
      return res.status(400).json({ error: 'userId and inviteId are required' });
    }

    try {
      const accountId = process.env.R2_ACCOUNT_ID;
      const accessKeyId = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const customEndpoint = process.env.R2_ENDPOINT;
      const bucketName = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
      const publicUrl = process.env.R2_PUBLIC_URL;

      if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
        throw new Error("Missing R2 configuration environment variables.");
      }

      const client = new S3Client({
        region: "auto",
        endpoint: customEndpoint || `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const timestamp = Date.now();
      const sanitizedFileName = file.originalFilename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const fileName = `users/${userId}/${inviteId}/${timestamp}-${sanitizedFileName}`;

      const fileContent = fs.readFileSync(file.filepath);

      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: fileContent,
          ContentType: file.mimetype,
        })
      );

      const url = `${publicUrl}/${fileName}`;
      res.status(200).json({ success: true, url, key: fileName });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
