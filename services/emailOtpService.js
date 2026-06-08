const crypto = require("crypto");
const EmailOtp = require("../model/EmailOtp");
const ApiError = require("../utilits/ApiError");
const { sendEmail } = require("./emailService");

const DEFAULT_TTL_MINUTES = 10;
const DEFAULT_MAX_ATTEMPTS = 5;

function getOtpSecret() {
  return process.env.OTP_SECRET || process.env.JWT_SECRET || "otp-secret";
}

function hashOtp(code) {
  return crypto
    .createHash("sha256")
    .update(`${code}:${getOtpSecret()}`)
    .digest("hex");
}

function generateOtpCode(length = 6) {
  const digits = "0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += digits[Math.floor(Math.random() * digits.length)];
  }
  return out;
}

async function issueEmailOtp(email, purpose = "signup") {
  const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || DEFAULT_TTL_MINUTES);
  const code = generateOtpCode(Number(process.env.OTP_LENGTH || 6));
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await EmailOtp.deleteMany({ email, purpose });
  await EmailOtp.create({
    email,
    purpose,
    codeHash: hashOtp(code),
    expiresAt,
  });

  const subject = "Your Vrateez email verification code";
  const text = `Your Vrateez verification code is ${code}. It expires in ${ttlMinutes} minutes.`;
  const html = `<p>Your Vrateez verification code is <strong>${code}</strong>.</p><p>This code expires in ${ttlMinutes} minutes.</p>`;

  await sendEmail({ to: email, subject, text, html });

  return { expiresAt };
}

async function verifyEmailOtp(email, code, purpose = "signup") {
  const record = await EmailOtp.findOne({ email, purpose }).sort({ createdAt: -1 });

  if (!record) {
    throw new ApiError(400, "OTP expired or not found");
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne();
    throw new ApiError(400, "OTP expired or not found");
  }

  const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || DEFAULT_MAX_ATTEMPTS);
  if (record.attempts >= maxAttempts) {
    throw new ApiError(429, "OTP attempts exceeded. Please request a new code.");
  }

  if (record.codeHash !== hashOtp(code)) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, "Invalid OTP");
  }

  record.verifiedAt = new Date();
  await record.deleteOne();

  return true;
}

module.exports = { issueEmailOtp, verifyEmailOtp };
