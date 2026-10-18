const express = require("express");
const router = express.Router();

const {
  getActiveBanners,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
} = require("../controllers/bannerController");

const { isAuthentication, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Public route: only active banners
router.get("/", getActiveBanners);

// Admin routes
router.get("/admin/all", isAuthentication, isAdmin, getAllBanners);
router.get("/admin/:id", isAuthentication, isAdmin, getBannerById);

// Create banner with image upload
router.post(
  "/",
  isAuthentication,
  isAdmin,
  upload.single("image"),
  createBanner,
);

// Update banner with optional image upload
router.patch(
  "/:id",
  isAuthentication,
  isAdmin,
  upload.single("image"),
  updateBanner,
);

// Toggle banner status
router.patch("/:id/status", isAuthentication, isAdmin, toggleBannerStatus);

// Delete banner and its Cloudinary image
router.delete("/:id", isAuthentication, isAdmin, deleteBanner);

module.exports = router;
