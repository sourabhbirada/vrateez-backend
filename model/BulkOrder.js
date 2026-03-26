const mongoose = require("mongoose");

const bulkOrderSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true, default: "" },
    yourName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    location: { type: String, trim: true, default: "" },
    inquiryType: {
      type: String,
      required: true,
      enum: ["retail", "cafe", "gifting", "gym", "distributor", "other"],
    },
    message: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BulkOrder", bulkOrderSchema);