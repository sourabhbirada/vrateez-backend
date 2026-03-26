const asyncHandler = require("../utilits/asyncHandler");
const { ok } = require("../utilits/response");

const health = asyncHandler(async (_req, res) => {
  return ok(res, { uptime: process.uptime() }, "API is healthy");
});

module.exports = { health };
   