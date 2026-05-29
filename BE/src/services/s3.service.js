import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

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
    try {
      const localPath = path.join("uploads", bucket, key);
      await fs.promises.mkdir(path.dirname(localPath), { recursive: true });
      const writeStream = fs.createWriteStream(localPath);
      await pipeline(body, writeStream);
      console.log(`[MOCK S3] Saved to local storage: ${localPath}`);
    } catch (err) {
      console.error(`[MOCK S3] Local write error:`, err);
      // Consume the stream so busboy doesn't hang in case of failure
      for await (const chunk of body) { /* do nothing */ }
    }
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
    return `http://localhost:${env.PORT || 4000}/proxy/mock-s3?bucket=${bucket}&key=${key}`;
  }
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
