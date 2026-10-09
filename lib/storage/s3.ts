import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
export const isConfigured = () => Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
export const s3 = new S3Client({ region: "auto", endpoint: process.env.S3_ENDPOINT,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY!, secretAccessKey: process.env.S3_SECRET_KEY! } });
export const put = (Key: string, Body: Buffer, ContentType: string) =>
  s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key, Body, ContentType }));
export const remove = (Key: string) => s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key }));
export const get = (Key: string) => s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key }));
