function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function resolveErrorMessage(err) {
  return (
    err?.message ||
    err?.error?.description ||
    err?.error?.message ||
    err?.description ||
    "Internal server error"
  );
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = resolveErrorMessage(err);

  // Keep detailed server logs for runtime debugging while returning safe messages to clients.
  console.error("API error:", {
    statusCode,
    message,
    name: err?.name,
    code: err?.code,
    stack: err?.stack,
    raw: err,
  });

  res.status(statusCode).json({
    status: false,
    message,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
