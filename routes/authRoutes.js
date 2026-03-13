const express = require("express");
const { register, login, me } = require("../controller/authController");
const { protect } = require("../middleware/authMiddleware");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post("/register", requireFields(["name", "email", "password"]), register);
router.post("/login", requireFields(["email", "password"]), login);
router.get("/me", protect, me);

module.exports = router;
