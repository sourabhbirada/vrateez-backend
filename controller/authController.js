const bcrypt = require("bcryptjs");
const User = require("../model/User");
const Cart = require("../model/Cart");
const Order = require("../model/Order");
const ApiError = require("../utilits/ApiError");
const asyncHandler = require("../utilits/asyncHandler");
const { ok } = require("../utilits/response");
const { generateToken } = require("../services/tokenService");
const { issueEmailOtp, verifyEmailOtp } = require("../services/emailOtpService");

function normalizeIndianMobile(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("91")) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(-10);
  if (digits.length >= 10) return digits.slice(-10);
  return null;
}

function escapeRegex(input) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function attachGuestOrdersToUser(user) {
  const email = String(user.email || "").trim().toLowerCase();
  const normalizedPhone = normalizeIndianMobile(user.phone);

  const identityMatchers = [];
  if (email) {
    identityMatchers.push({ "guestInfo.email": { $regex: `^${escapeRegex(email)}$`, $options: "i" } });
  }

  if (normalizedPhone) {
    identityMatchers.push({ contactPhone: normalizedPhone });
    identityMatchers.push({
      "guestInfo.phone": {
        $in: [normalizedPhone, `+91${normalizedPhone}`, `91${normalizedPhone}`, `0${normalizedPhone}`],
      },
    });
  }

  if (!identityMatchers.length) return;

  await Order.updateMany(
    {
      $and: [{ $or: [{ user: { $exists: false } }, { user: null }] }, { $or: identityMatchers }],
    },
    { $set: { user: user._id } }
  );
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required");
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    if (existing.emailVerified) {
      throw new ApiError(409, "Email already registered");
    }

    existing.name = name;
    existing.phone = phone;
    existing.password = await bcrypt.hash(password, 10);
    await existing.save();
    await issueEmailOtp(existing.email, "signup");

    return ok(res, { requiresEmailOtp: true, email: existing.email }, "OTP sent");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    phone,
    password: hashed,
    emailVerified: false,
  });
  await Cart.create({ user: user._id, items: [] });
  await attachGuestOrdersToUser(user);
  await issueEmailOtp(user.email, "signup");

  return ok(res, { requiresEmailOtp: true, email: user.email }, "OTP sent", 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.emailVerified) {
    throw new ApiError(403, "Email not verified. Please verify OTP sent to your email.");
  }

  await attachGuestOrdersToUser(user);

  const token = generateToken(user._id);

  return ok(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      phone: user.phone || undefined,
      role: user.role,
    },
  });
});


const cmslogin = a

const me = asyncHandler(async (req, res) => {
  const u = req.user;
  return ok(res, {
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      phone: u.phone || undefined,
      role: u.role,
      addresses: u.addresses || [],
    },
  });
});

const requestEmailOtp = asyncHandler(async (req, res) => {
  const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(404, "Account not found");
  }

  if (user.emailVerified) {
    throw new ApiError(400, "Email already verified");
  }

  await issueEmailOtp(user.email, "signup");
  return ok(res, { email: user.email }, "OTP sent");
});

const verifyEmailOtpCode = asyncHandler(async (req, res) => {
  const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();

  if (!normalizedEmail || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(404, "Account not found");
  }

  if (!user.emailVerified) {
    await verifyEmailOtp(normalizedEmail, otp, "signup");
    user.emailVerified = true;
    await user.save();
  }

  await attachGuestOrdersToUser(user);
  const token = generateToken(user._id);

  return ok(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      phone: user.phone || undefined,
      role: user.role,
    },
  });
});

module.exports = { register, login, me, requestEmailOtp, verifyEmailOtpCode };
