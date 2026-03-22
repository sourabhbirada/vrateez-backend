const express = require("express");
const router = express.Router();
const { register, login, loginWithOTP, sendOTP, resendOTP, verifyOTP,
        forgotPassword, resetPassword, changePassword, getProfile, logout } = require("../controller/authController");
const { protect } = require("../middleware/authMiddleware");
const { requireFields, requireOneOf } = require("../middleware/validateMiddleware");
const { validatePasswordStrength } = require("../middleware/passwordMiddleware");


// AUTH
router.post("/register", requireFields(["name", "password"]), requireOneOf(["email", "mobile"]), validatePasswordStrength, register);
router.post("/login", requireFields(["password"]), requireOneOf(["email", "mobile"]), login);
router.post("/otp/send", requireOneOf(["email", "mobile"]), sendOTP);
router.post("/otp/resend", requireOneOf(["email", "mobile"]), resendOTP);
router.post("/otp/verify", requireFields(["otp"]), requireOneOf(["email", "mobile"]), verifyOTP);
router.post("/login/otp", requireFields(["otp"]), requireOneOf(["email", "mobile"]), loginWithOTP);
router.post("/password/forgot", requireOneOf(["email", "mobile"]), forgotPassword);
router.post("/password/reset", requireFields(["otp", "newPassword", "confirmNewPassword"]), requireOneOf(["email", "mobile"]), validatePasswordStrength, resetPassword);

// USER (protected)
router.get( "/getMyProfile",              protect, getProfile);
router.post("/password/change", protect, requireFields(["currentPassword", "newPassword"]), validatePasswordStrength, changePassword);
router.post("/logout",          protect, logout);

module.exports = router;