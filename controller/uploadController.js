const crypto = require("crypto");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

function hmac(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function getSignatureKey(key, dateStamp) {
  const kDate = hmac(`AWS4${key}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

const uploadImages = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  if (!files.length) {
    throw new ApiError(400, "No files uploaded");
  }
  if (!accessKeyId || !secretAccessKey || !bucket || !region) {
    throw new ApiError(500, "S3 is not configured");
  }

  const uploads = [];
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  for (const file of files) {
    if (!file?.name || !file?.type) {
      throw new ApiError(400, "Invalid image payload");
    }
    const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const canonicalUri = `/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const canonicalQuery = [
      "X-Amz-Algorithm=AWS4-HMAC-SHA256",
      `X-Amz-Credential=${encodeURIComponent(`${accessKeyId}/${credentialScope}`)}`,
      `X-Amz-Date=${amzDate}`,
      "X-Amz-Expires=900",
      "X-Amz-SignedHeaders=host",
    ].join("&");

    const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQuery}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto
      .createHash("sha256")
      .update(canonicalRequest)
      .digest("hex")}`;
    const signingKey = getSignatureKey(secretAccessKey, dateStamp);
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
    const uploadUrl = `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
    const publicUrl = `https://${host}/${key}`;
    uploads.push({ uploadUrl, publicUrl, key, contentType: file.type });
  }

  return ok(res, { uploads }, "Upload URLs generated");
});

module.exports = { uploadImages };
