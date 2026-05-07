const express = require("express");
const {
  listBanners,
  listBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controller/bannerController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", listBanners);
router.get("/admin", protect, adminOnly, listBannersAdmin);
router.post("/", protect, adminOnly, createBanner);
router.patch("/:id", protect, adminOnly, updateBanner);
router.delete("/:id", protect, adminOnly, deleteBanner);

module.exports = router;
