const bcrypt = require("bcryptjs");
const User = require("../model/User");
const Cart = require("../model/Cart");
const ApiError = require("../utilits/ApiError");
const asyncHandler = require("../utilits/asyncHandler");
const { ok } = require("../utilits/response");
const { generateToken } = require("../services/tokenService");
const { sendOTPEmail } = require("../services/emailService");

const normalizeIdentifier = (req) => {
  const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null;
  const mobile = req.body.mobile ? String(req.body.mobile).trim() : null;
  return { email, mobile };
};

const findUserByIdentifier = async ({ email, mobile }) => {
  const conditions = [];
  if (email) conditions.push({ email });
  if (mobile) conditions.push({ phone: mobile });

  if (!conditions.length) return null;
  if (conditions.length === 1) return User.findOne(conditions[0]);

  return User.findOne({ $or: conditions });
};

// const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const createOtp=() => "123456"; // For testing purposes, replace with above line in production
const register = asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const { email, mobile } = normalizeIdentifier(req);

  if (!email) {
    throw new ApiError(400, "Email is required for registration and OTP delivery");
  }

  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    throw new ApiError(409, "Email already registered");
  }

  const otp = createOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  const hashed = await bcrypt.hash(password, 10);

  if (user) {
    user.name = name;
    user.password = hashed;
    user.phone = mobile || user.phone;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
  } else {
    user = await User.create({
      name,
      email,
      phone: mobile,
      password: hashed,
      otp,
      otpExpiry,
    });
  }

  await user.save();
  await sendOTPEmail(email, otp);

  return ok(res, null, "OTP sent to email. Please verify.");
});

const sendOTP = asyncHandler(async (req, res) => {
  const { email, mobile } = normalizeIdentifier(req);
  const user = await findUserByIdentifier({ email, mobile });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.email) {
    throw new ApiError(400, "User account does not have an email configured for OTP delivery");
  }

  const otp = createOtp();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendOTPEmail(user.email, otp);

  return ok(res, null, "OTP sent successfully");
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const { email, mobile } = normalizeIdentifier(req);
  const user = await findUserByIdentifier({ email, mobile });

  if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  let cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    cart = await Cart.create({ user: user._id, items: [] });
  }

  const token = generateToken(user._id);

  return ok(
    res,
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    },
    "OTP verified successfully"
  );
});

const login = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { email, mobile } = normalizeIdentifier(req);

  const user = await findUserByIdentifier({ email, mobile });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your account first");
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
      phone: user.phone,
      role: user.role,
    },
  });
});

const loginWithOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const { email, mobile } = normalizeIdentifier(req);

  const user = await findUserByIdentifier({ email, mobile });
  if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  const token = generateToken(user._id);

  return ok(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  }, "Login successful");
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email, mobile } = normalizeIdentifier(req);
  const user = await findUserByIdentifier({ email, mobile });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.email) {
    throw new ApiError(400, "User account does not have an email configured for OTP delivery");
  }

  const otp = createOtp();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendOTPEmail(user.email, otp);

  return ok(res, null, "Password reset OTP sent to your email");
});

const resetPassword = asyncHandler(async (req, res) => {
  const { otp, newPassword, confirmNewPassword } = req.body;
  const { email, mobile } = normalizeIdentifier(req);

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  const user = await findUserByIdentifier({ email, mobile });
  if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.isVerified = true;
  await user.save();

  return ok(res, null, "Password reset successfully");
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return ok(res, null, "Password cha nged successfully");
});

const getProfile = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user });
});

const logout = asyncHandler(async (_req, res) => {
  return ok(res, null, "Logged out successfully");
});

const verifyEmail = verifyOTP;
const resendOTP = sendOTP;
const me = getProfile;

module.exports = {
  register,
  login,
  sendOTP,
  verifyOTP,
  loginWithOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  logout,
  verifyEmail,
  resendOTP,
  me,
};
