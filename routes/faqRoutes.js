const express = require("express");
const {
  listFaqs,
  listFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
} = require("../controller/faqController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", listFaqs);
router.get("/admin", protect, adminOnly, listFaqsAdmin);
router.post("/", protect, adminOnly, createFaq);
router.patch("/:id", protect, adminOnly, updateFaq);
router.delete("/:id", protect, adminOnly, deleteFaq);

module.exports = router;
