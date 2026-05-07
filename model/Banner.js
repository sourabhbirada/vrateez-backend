const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    cta: { type: String, default: "Shop Now" },
    ctaLink: { type: String, default: "/shop" },
    image: { type: String, required: true },
    bgColor: { type: String, default: "#FFF7ED" },
    isActive: { type: Boolean, default: true },
    position: { type: Number, default: 1 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Banner", bannerSchema);
