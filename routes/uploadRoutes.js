const express = require("express");
const { uploadImages } = require("../controller/uploadController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/images", protect, adminOnly, uploadImages);

module.exports = router;
