const express = require("express");
const {
  listCategories,
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/categoryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", listCategories);
router.get("/admin", protect, adminOnly, listCategoriesAdmin);
router.post("/", protect, adminOnly, createCategory);
router.patch("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;
