const dotenv = require("dotenv");
const connectDB = require("../config/db");
const Product = require("../model/Product");
const { seedProducts } = require("./productSeedData");

dotenv.config();

async function seed() {
  await connectDB();

  for (const product of seedProducts) {
    await Product.updateOne({ slug: product.slug }, { $set: product }, { upsert: true });
  }

  console.log(`Seed complete: ${seedProducts.length} products upserted`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
