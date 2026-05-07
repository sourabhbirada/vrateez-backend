const Category = require("../model/Category");
const Product = require("../model/Product");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");

const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  const withCounts = await Promise.all(
    categories.map(async (category) => {
      const productsCount = await Product.countDocuments({ category: category.slug, isActive: true });
      return { ...category, productsCount };
    }),
  );
  return ok(res, { items: withCounts });
});

const listCategoriesAdmin = asyncHandler(async (_req, res) => {
  const items = await Category.find().sort({ sortOrder: 1, name: 1 });
  return ok(res, { items });
});

const createCategory = asyncHandler(async (req, res) => {
  const created = await Category.create(req.body);
  return ok(res, { category: created }, "Category created", 201);
});

const updateCategory = asyncHandler(async (req, res) => {
  const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Category not found");
  return ok(res, { category: updated }, "Category updated");
});

const deleteCategory = asyncHandler(async (req, res) => {
  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Category not found");
  return ok(res, { category: deleted }, "Category deleted");
});

module.exports = {
  listCategories,
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};
