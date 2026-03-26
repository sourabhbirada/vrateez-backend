function ok(res, data, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    status: true,
    message,
    data,
  });
}

module.exports = { ok };
