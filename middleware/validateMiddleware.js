const ApiError = require("../utilits/ApiError");

function requireFields(fields = []) {
  return (req, _res, next) => {
    const missing = fields.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === "");

    if (missing.length > 0) {
      return next(new ApiError(400, `Missing required fields: ${missing.join(", ")}`));
    }

    next();
  };
}

function requireOneOf(fields = []) {
  return (req, _res, next) => {
    const hasAny = fields.some((field) => {
      const value = req.body[field];
      return value !== undefined && value !== null && String(value).trim() !== "";
    });

    if (!hasAny) {
      return next(new ApiError(400, `At least one of these fields is required: ${fields.join(", ")}`));
    }

    next();
  };
}

module.exports = { requireFields, requireOneOf };
