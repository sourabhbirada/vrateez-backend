const bcrypt = require("bcryptjs");
const User = require("../model/User");
const Cart = require("../model/Cart");
const Order = require("../model/Order");
const ApiError = require("../utilits/ApiError");
const asyncHandler = require("../utilits/asyncHandler");
const { ok } = require("../utilits/response");
const { generateToken } = require("../services/tokenService");

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
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, phone, password: hashed });
  await Cart.create({ user: user._id, items: [] });
  await attachGuestOrdersToUser(user);

  const token = generateToken(user._id);

  return ok(
    res,
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || undefined,
        role: user.role,
      },
    },
    "User registered",
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new ApiError(401, "Invalid credentials");
  }

  await attachGuestOrdersToUser(user);

  const token = generateToken(user._id);

  return ok(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  const u = req.user;
  return ok(res, {
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || undefined,
      role: u.role,
      addresses: u.addresses || [],
    },
  });
});

module.exports = { register, login, me };
