const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const ApiError = require("../utilits/ApiError");

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;
const publicBase = process.env.AWS_S3_PUBLIC_BASE_URL;

function assertS3Configured() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !bucket || !region) {
    throw new ApiError(500, "S3 is not configured");
  }
}

function getClient() {
  assertS3Configured();
  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function sanitizeFileName(name) {
  const base = String(name || "image").split(/[/\\]/).pop() || "image";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").toLowerCase();
  return cleaned || "image";
}

function buildPublicUrl(key) {
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  }
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

function buildObjectKey(fileName, folder = "products") {
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitizeFileName(fileName)}`;
}

async function uploadBufferToS3(buffer, fileName, contentType, folder = "products") {
  const client = getClient();
  const key = buildObjectKey(fileName, folder);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    })
  );
  return { key, publicUrl: buildPublicUrl(key), contentType: contentType || "application/octet-stream" };
}

async function createPresignedUploads(files, folder = "products") {
  const client = getClient();
  const uploads = [];

  for (const file of files) {
    if (!file?.name || !file?.type) {
      throw new ApiError(400, "Invalid image payload");
    }
    const key = buildObjectKey(file.name, folder);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: file.type,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
    uploads.push({
      uploadUrl,
      publicUrl: buildPublicUrl(key),
      key,
      contentType: file.type,
    });
  }

  return uploads;
}

module.exports = {
  uploadBufferToS3,
  createPresignedUploads,
  buildPublicUrl,
};
