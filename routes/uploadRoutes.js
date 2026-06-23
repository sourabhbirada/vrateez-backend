const express = require("express");
const { uploadImages, uploadImagesDirect } = require("../controller/uploadController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/images", protect, adminOnly, uploadImages);
router.post("/images/direct", protect, adminOnly, uploadImagesDirect);

module.exports = router;
