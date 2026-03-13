const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ["cookie", "energy-bar", "desert-date"],
      required: true,
    },
    image: { type: String, required: true },
    images: [{ type: String }],
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discount: { type: String },
    weight: { type: String, required: true },
    description: { type: String, required: true },
    benefits: [{ type: String }],
    ingredients: { type: String },
    nutritionHighlights: [{ type: String }],
    stock: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
