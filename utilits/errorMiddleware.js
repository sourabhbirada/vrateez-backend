function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
