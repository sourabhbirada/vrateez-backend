function getPackOptionForQuantity(product, quantity) {
  const qty = Number(quantity);
  if (!qty || !Array.isArray(product?.packOptions)) return null;
  return product.packOptions.find((pack) => Number(pack.units) === qty) || null;
}

function getEffectiveUnitPrice(product, quantity) {
  const basePrice = Number(product?.price) || 0;
  const pack = getPackOptionForQuantity(product, quantity);
  if (!pack || !pack.discountPercent) return basePrice;
  const discounted = basePrice * (1 - Number(pack.discountPercent) / 100);
  return Math.round(discounted * 100) / 100;
}

function getLineTotal(product, quantity) {
  const unitPrice = getEffectiveUnitPrice(product, quantity);
  return Math.round(unitPrice * Number(quantity) * 100) / 100;
}

function normalizePackOptions(packOptions = []) {
  if (!Array.isArray(packOptions)) return [];
  return packOptions
    .map((pack) => ({
      units: Number(pack.units),
      label: String(pack.label || "").trim() || `Pack of ${pack.units}`,
      discountPercent: Math.min(100, Math.max(0, Number(pack.discountPercent) || 0)),
    }))
    .filter((pack) => pack.units > 0)
    .sort((a, b) => a.units - b.units);
}

module.exports = {
  getPackOptionForQuantity,
  getEffectiveUnitPrice,
  getLineTotal,
  normalizePackOptions,
};
