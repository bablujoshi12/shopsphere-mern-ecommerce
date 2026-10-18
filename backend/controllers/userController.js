const User = require("../model/User");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/wrapAsync");
const mongoose = require("mongoose");

// GET /api/users/admin/all
// Get users with search, filters and pagination
const getAllUsers = wrapAsync(async (req, res) => {
  const {
    search = "",
    role = "",
    status = "",
    page = 1,
    limit = 10,
  } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const filter = {};

  // Search by username, email or mobile
  if (search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const searchRegex = new RegExp(escapedSearch, "i");

    filter.$or = [
      { username: searchRegex },
      { email: searchRegex },
      { mobile: searchRegex },
    ];
  }

  // Role filter
  if (role) {
    if (!["customer", "admin"].includes(role)) {
      throw new ExpressError(400, "Invalid role filter");
    }

    filter.role = role;
  }

  // Status filter
  if (status) {
    if (!["active", "blocked"].includes(status)) {
      throw new ExpressError(400, "Invalid status filter");
    }

    filter.isBlocked = status === "blocked";
  }

  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean(),

    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    users,
    pagination: {
      totalUsers,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalUsers / limitNumber),
      limit: limitNumber,
    },
  });
});

// GET /api/users/admin/:id
// Get one user's details
const getUserById = wrapAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ExpressError(400, "Invalid user ID"));
  }

  const user = await User.findById(req.params.id).select("-password").lean();

  if (!user) {
    return next(new ExpressError(404, "User not found"));
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    user,
  });
});

// PATCH /api/users/admin/:id
// Update username, email and mobile
const updateUser = wrapAsync(async (req, res, next) => {
  const { username, email, mobile } = req.body;
  const updates = {};

  if (username !== undefined) {
    if (typeof username !== "string" || !username.trim()) {
      return next(new ExpressError(400, "Valid username is required"));
    }

    updates.username = username.trim();
  }

  if (email !== undefined) {
    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return next(new ExpressError(400, "Valid email is required"));
    }

    const newEmail = email.trim().toLowerCase();

    // Reset verification if email is changed
    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return next(new ExpressError(404, "User not found"));
    }

    if (existingUser.email !== newEmail) {
      updates.email = newEmail;
      updates.isEmailVerified = false;
    }
  }

  if (mobile !== undefined) {
    if (typeof mobile !== "string" || !mobile.trim()) {
      return next(new ExpressError(400, "Valid mobile number is required"));
    }

    updates.mobile = mobile.trim();
  }

  if (Object.keys(updates).length === 0) {
    return next(new ExpressError(400, "No changes provided to update"));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    {
      new: true,
      runValidators: true,
    },
  ).select("-password");

  if (!user) {
    return next(new ExpressError(404, "User not found"));
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user,
  });
});

// PATCH /api/users/admin/:id/role
// Change customer/admin role
const updateUserRole = wrapAsync(async (req, res, next) => {
  const { role } = req.body;

  if (!["customer", "admin"].includes(role)) {
    return next(new ExpressError(400, "Invalid role"));
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ExpressError(400, "Invalid user ID"));
  }

  // Prevent changing your own role
  if (String(req.user._id) === req.params.id) {
    return next(new ExpressError(400, "You cannot change your own role"));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { role } },
    {
      new: true,
      runValidators: true,
    },
  ).select("-password");

  if (!user) {
    return next(new ExpressError(404, "User not found"));
  }

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    user,
  });
});

// PATCH /api/users/admin/:id/block
// Block or unblock a customer
const toggleUserBlock = wrapAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ExpressError(400, "Invalid user ID"));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ExpressError(404, "User not found"));
  }

  // Admin accounts cannot be blocked through this endpoint
  if (user.role === "admin") {
    return next(new ExpressError(400, "Admin accounts cannot be blocked here"));
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.status(200).json({
    success: true,
    message: user.isBlocked
      ? "User blocked successfully"
      : "User unblocked successfully",
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isBlocked: user.isBlocked,
    },
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  toggleUserBlock,
};
