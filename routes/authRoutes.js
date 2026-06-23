const express = require("express");
const { register, login, me, requestEmailOtp, verifyEmailOtpCode } = require("../controller/authController");
const { protect } = require("../middleware/authMiddleware");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post("/register", requireFields(["name", "email", "password"]), register);
router.post("/request-otp", requireFields(["email"]), requestEmailOtp);
router.post("/verify-otp", requireFields(["email", "otp"]), verifyEmailOtpCode);
router.post("/login", requireFields(["email", "password"]), login);
router.get("/me", protect, me);


router.post('/cms/logic', cmslogin)

module.exports = router;
