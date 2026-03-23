import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadStreamToS3({ bucket, key, body, contentType }) {
  // MOCK MODE FOR DEV TESTING
  if (env.AWS_ACCESS_KEY_ID.startsWith("mock_")) {
    console.log(`[MOCK S3] Uploading to ${bucket}/${key} (Content-Type: ${contentType})`);
    // Consume the stream so busboy doesn't hang
    for await (const chunk of body) { /* do nothing */ }
    return { etag: "mock-etag-" + Date.now() };
  }

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });

  const result = await upload.done();
  return {
    etag: result.ETag || null,
  };
}

export async function createPresignedGetUrl({ bucket, key, expiresInSeconds = 60 }) {
  if (env.AWS_ACCESS_KEY_ID.startsWith("mock_")) {
    return `https://mock-s3.amazonaws.com/${bucket}/${key}?expires=${expiresInSeconds}`;
  }
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
