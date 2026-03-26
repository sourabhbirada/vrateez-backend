const jwt = require("jsonwebtoken");
const User = require("../model/User");
const asyncHandler = require("../utilits/asyncHandler");

const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    const error = new Error("Unauthorized: token missing");
    error.statusCode = 401;
    throw error;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    const error = new Error("Unauthorized: user not found");
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  next();
});

const adminOnly = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    const error = new Error("Forbidden: admin access required");
    error.statusCode = 403;
    throw error;
  }

  next();
};

module.exports = { protect, adminOnly };
