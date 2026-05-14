const bcrypt = require("bcryptjs");
const User = require("../model/User");

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@vrateez.com";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345";
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || "Admin";

async function ensureDefaultAdmin() {
  const email = DEFAULT_ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
    }
    return { created: false, email: existing.email };
  }

  const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const admin = await User.create({
    name: DEFAULT_ADMIN_NAME,
    email,
    password: hashed,
    role: "admin",
  });

  return { created: true, email: admin.email };
}

module.exports = { ensureDefaultAdmin };
