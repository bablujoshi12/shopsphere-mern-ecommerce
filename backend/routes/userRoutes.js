const router = require("express").Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserBlock,
  updateUserRole,
} = require("../controllers/userController");

const { isAuthentication, isAdmin } = require("../middleware/authMiddleware");

// All users with search, filters and pagination
router.get("/admin/all", isAuthentication, isAdmin, getAllUsers);

// Block or unblock a customer
router.patch("/admin/:id/block", isAuthentication, isAdmin, toggleUserBlock);

// Update user details
router.patch("/admin/:id", isAuthentication, isAdmin, updateUser);

// Get single user details
router.get("/admin/:id", isAuthentication, isAdmin, getUserById);

router.patch("/admin/:id/role", isAuthentication, isAdmin, updateUserRole);

module.exports = router;
