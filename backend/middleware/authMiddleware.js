const jwt = require("jsonwebtoken");
const ExpressError = require("../utils/ExpressError");
const User = require("../model/User");

const isAuthentication = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return next(new ExpressError(401, "JWT token required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(decoded._id);

    if (!user) {
      return next(new ExpressError(401, "User not found"));
    }

    if (user.isBlocked) {
      return next(
        new ExpressError(403, "Your account has been blocked by admin"),
      );
    }

    req.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (err) {
    return next(new ExpressError(401, "Invalid or expired JWT token"));
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ExpressError(401, "Authentication required"));
  }

  if (req.user.role !== "admin") {
    return next(new ExpressError(403, "Admin access required"));
  }

  return next();
};

module.exports = {
  isAuthentication,
  isAdmin,
};
