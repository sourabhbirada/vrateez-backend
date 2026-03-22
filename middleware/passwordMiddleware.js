const ApiError = require("../utilits/ApiError");

function validatePasswordStrength(req, _res, next) {
  const password = req.body.newPassword || req.body.password;

  if (!password) {
    return next();
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return next(
      new ApiError(
        400,
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      )
    );
  }

  next();
}

module.exports = { validatePasswordStrength };
