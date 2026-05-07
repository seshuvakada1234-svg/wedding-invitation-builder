import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'File key is required' });
  }

  try {
    const accountId = process.env.R2_ACCOUNT_ID?.trim().replace(/^["'](.+)["']$/, "$1");
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim().replace(/^["'](.+)["']$/, "$1");
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim().replace(/^["'](.+)["']$/, "$1");
    const bucket = process.env.R2_BUCKET?.trim().replace(/^["'](.+)["']$/, "$1");
    const endpoint = process.env.R2_ENDPOINT?.trim().replace(/^["'](.+)["']$/, "$1");

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint) {
      return res.status(500).json({ error: "Missing R2 configuration environment variables" });
    }

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
}
