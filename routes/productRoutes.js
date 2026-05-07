const express = require("express");
const {
  getProducts,
  getProductsAdmin,
  getProductBySlug,
  createProduct,
  updateProduct,
} = require("../controller/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/admin", protect, adminOnly, getProductsAdmin);
router.get("/:slug", getProductBySlug);
router.post("/", protect, adminOnly, createProduct);
router.patch("/:id", protect, adminOnly, updateProduct);

module.exports = router;
