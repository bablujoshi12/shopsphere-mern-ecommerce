const express = require("express");
const router = express.Router();

const {
  createReview,
  getProductReviews,
  getMyProductReview,
  updateReview,
  deleteReview,
  getAllReviews,
  adminDeleteReview,
} = require("../controllers/reviewController");

const { isAuthentication, isAdmin } = require("../middleware/authMiddleware");

// Public: Get approved reviews for a product
router.get("/product/:productId", getProductReviews);

// Customer: Get own review for a product
router.get("/my/:productId", isAuthentication, getMyProductReview);

// Customer: Review operations
router.post("/", isAuthentication, createReview);
router.patch("/:reviewId", isAuthentication, updateReview);
router.delete("/:reviewId", isAuthentication, deleteReview);

// Admin: View all reviews and delete inappropriate reviews
router.get("/admin", isAuthentication, isAdmin, getAllReviews);

router.delete("/admin/:reviewId", isAuthentication, isAdmin, adminDeleteReview);

module.exports = router;
