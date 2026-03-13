const bcrypt = require("bcryptjs");
const User = require("../model/User");
const Cart = require("../model/Cart");
const ApiError = require("../utilits/ApiError");
const asyncHandler = require("../utilits/asyncHandler");
const { ok } = require("../utilits/response");
const { generateToken } = require("../services/tokenService");

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, phone, password: hashed });
  await Cart.create({ user: user._id, items: [] });

  const token = generateToken(user._id);

  return ok(
    res,
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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

  const token = generateToken(user._id);

  return ok(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user });
});

module.exports = { register, login, me };
