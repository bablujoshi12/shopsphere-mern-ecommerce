const express = require("express");
const router = express.Router();

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { isAuthentication, isAdmin } = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");

// Public: Get all categories
router.get("/", getAllCategories);

// Admin: Get all categories
router.get("/admin/all", isAuthentication, isAdmin, getAllCategories);

// Public: Get category by ID
router.get("/:id", getCategoryById);

// Admin: Create category with image upload
router.post(
  "/",
  isAuthentication,
  isAdmin,
  upload.single("image"),
  createCategory,
);

// Admin: Update category with optional image upload
router.patch(
  "/:id",
  isAuthentication,
  isAdmin,
  upload.single("image"),
  updateCategory,
);

// Admin: Delete category and its Cloudinary image
router.delete("/:id", isAuthentication, isAdmin, deleteCategory);

module.exports = router;
