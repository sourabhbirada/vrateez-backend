const dotenv = require("dotenv");
const connectDB = require("../config/db");
const Product = require("../model/Product");
const { seedProducts } = require("./productSeedData");

dotenv.config();

async function resetCatalog() {
  await connectDB();

  await Product.deleteMany({});
  await Product.insertMany(seedProducts, { ordered: true });

  console.log(`Reset complete: ${seedProducts.length} products inserted`);
  process.exit(0);
}

resetCatalog().catch((err) => {
  console.error("Reset failed", err);
  process.exit(1);
});
