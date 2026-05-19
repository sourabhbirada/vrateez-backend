const Product = require("../model/Product");
const asyncHandler = require("../utilits/asyncHandler");
const { ok } = require("../utilits/response");
const ApiError = require("../utilits/ApiError");
const { seedProducts } = require("../services/productSeedData");

const getProducts = asyncHandler(async (req, res) => {
  const { category, q, page = 1, limit = 20 } = req.query;

  const filter = { isActive: true };

  if (category) {
    filter.category = category;
  }

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  const allowSeed = process.env.ALLOW_PRODUCT_SEED === "true";
  // Self-heal empty catalog only when explicitly enabled.
  if (allowSeed && total === 0) {
    await Product.insertMany(seedProducts, { ordered: false }).catch(() => {
      // Ignore duplicate errors from concurrent requests.
    });

    const [seededItems, seededTotal] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return ok(res, {
      items: seededItems,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: seededTotal,
        totalPages: Math.ceil(seededTotal / Number(limit)),
      },
    });
  }

  return ok(res, {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

const getProductsAdmin = asyncHandler(async (req, res) => {
  const { category, q, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return ok(res, {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return ok(res, { product });
});

const getProductByIdAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return ok(res, { product });
});

const createProduct = asyncHandler(async (req, res) => {
  const created = await Product.create(req.body);
  return ok(res, { product: created }, "Product created", 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw new ApiError(404, "Product not found");
  }

  return ok(res, { product: updated }, "Product updated");
});

module.exports = {
  getProducts,
  getProductsAdmin,
  getProductByIdAdmin,
  getProductBySlug,
  createProduct,
  updateProduct,
};
