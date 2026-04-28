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
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const customEndpoint = process.env.R2_ENDPOINT;
    const bucketName = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
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

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
}
