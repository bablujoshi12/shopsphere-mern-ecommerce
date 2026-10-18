const bcrypt = require("bcryptjs");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const User = require("../model/User");
const jwt = require("jsonwebtoken");

const uploadToCloudinary = require("../utils/uploadToCloudinary");

const {
  deleteFromCloudinary,
  getPublicId,
} = require("../utils/deleteFromCloudinary");

// Signup
const signup = wrapAsync(async (req, res, next) => {
  const { username, email, mobile, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(new ExpressError(400, "Passwords do not match"));
  }

  const existingUser = await User.findOne({
    $or: [{ email: email.trim().toLowerCase() }, { username: username.trim() }],
  });

  if (existingUser) {
    return next(new ExpressError(409, "Username or email already exists"));
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const createUser = new User({
    username: username.trim(),
    email: email.trim().toLowerCase(),
    mobile,
    password: hashPassword,
  });

  await createUser.save();

  return res.status(201).json({
    message: "Signup successfully",
    success: true,
    email: createUser.email,
    username: createUser.username,
  });
});

// Login
const login = wrapAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  });

  if (!user) {
    return next(new ExpressError(403, "Wrong email or password"));
  }

  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: "Your account has been blocked by admin",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return next(new ExpressError(403, "Wrong email or password"));
  }

  const token = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "24h",
    },
  );

  return res.status(200).json({
    message: "Login successfully",
    success: true,
    token,
    username: user.username,
    email: user.email,
  });
});

// Get Logged-in User Profile
const getMe = wrapAsync(async (req, res, next) => {
  const { _id } = req.user;

  const currentUser = await User.findById(_id).select("-password");

  if (!currentUser) {
    return next(new ExpressError(404, "User not found"));
  }

  return res.status(200).json({
    message: "User data fetched successfully",
    success: true,
    currentUser,
  });
});

// Update Logged-in User Profile and Optional Profile Image
const updateMe = wrapAsync(async (req, res, next) => {
  const { _id } = req.user;
  const { username, mobile } = req.body;

  const currentUser = await User.findById(_id);

  if (!currentUser) {
    return next(new ExpressError(404, "User not found"));
  }

  const updates = {};

  if (username !== undefined) {
    if (typeof username !== "string" || !username.trim()) {
      return next(new ExpressError(400, "Valid username is required"));
    }

    updates.username = username.trim();
  }

  if (mobile !== undefined) {
    if (typeof mobile !== "string" || !mobile.trim()) {
      return next(new ExpressError(400, "Valid mobile number is required"));
    }

    updates.mobile = mobile.trim();
  }

  if (!req.file && Object.keys(updates).length === 0) {
    return next(new ExpressError(400, "No changes provided"));
  }

  const oldImageUrl = currentUser.profileImage;
  let newImageUrl = "";

  // Upload new image to Cloudinary
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer);

    if (!result?.secure_url) {
      return next(new ExpressError(500, "Failed to upload profile image"));
    }

    newImageUrl = result.secure_url;
    updates.profileImage = newImageUrl;
  }

  // Update user document
  Object.assign(currentUser, updates);

  try {
    await currentUser.save();
  } catch (error) {
    // Cleanup newly uploaded image if database update fails
    if (newImageUrl) {
      try {
        await deleteFromCloudinary(getPublicId(newImageUrl));
      } catch (cleanupError) {
        console.error(
          "Failed to clean up uploaded profile image:",
          cleanupError,
        );
      }
    }

    throw error;
  }

  // Delete previous image only after successful database update
  if (newImageUrl && oldImageUrl) {
    try {
      await deleteFromCloudinary(getPublicId(oldImageUrl));
    } catch (error) {
      console.error("Failed to delete previous profile image:", error);
    }
  }

  const updatedUser = await User.findById(_id).select("-password");

  return res.status(200).json({
    message: "Profile updated successfully",
    success: true,
    currentUser: updatedUser,
  });
});

// Delete Logged-in User's Profile Image
const deleteProfileImage = wrapAsync(async (req, res, next) => {
  const { _id } = req.user;

  const currentUser = await User.findById(_id);

  if (!currentUser) {
    return next(new ExpressError(404, "User not found"));
  }

  if (!currentUser.profileImage) {
    return next(new ExpressError(400, "No profile image to delete"));
  }

  const imageUrl = currentUser.profileImage;
  const publicId = getPublicId(imageUrl);

  // Remove image from Cloudinary
  const result = await deleteFromCloudinary(publicId);

  if (result?.result !== "ok" && result?.result !== "not found") {
    return next(
      new ExpressError(500, "Failed to delete profile image from Cloudinary"),
    );
  }

  // Clear profile image from database
  currentUser.profileImage = "";
  await currentUser.save();

  const updatedUser = await User.findById(_id).select("-password");

  return res.status(200).json({
    message: "Profile image deleted successfully",
    success: true,
    currentUser: updatedUser,
  });
});

module.exports = {
  signup,
  login,
  getMe,
  updateMe,
  deleteProfileImage,
};
