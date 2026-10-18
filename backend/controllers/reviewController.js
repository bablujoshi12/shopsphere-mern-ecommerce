const Review = require("../model/Review");
const Order = require("../model/Order");
const Product = require("../model/Product");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

// Create Review
module.exports.createReview = wrapAsync(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const userId = req.user._id;

  if (!productId || rating === undefined || !comment?.trim()) {
    throw new ExpressError(400, "Product, rating and comment are required");
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new ExpressError(400, "Rating must be between 1 and 5");
  }

  if (comment.trim().length > 2000) {
    throw new ExpressError(400, "Review comment cannot exceed 2000 characters");
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ExpressError(404, "Product not found");
  }

  const existingReview = await Review.findOne({
    user: userId,
    product: productId,
  });

  if (existingReview) {
    throw new ExpressError(409, "You have already reviewed this product");
  }

  const verifiedPurchase = await Order.exists({
    user: userId,
    orderStatus: "Delivered",
    "items.product": productId,
  });

  const review = await Review.create({
    user: userId,
    product: productId,
    rating: numericRating,
    comment: comment.trim(),
    isVerifiedPurchase: Boolean(verifiedPurchase),
    status: "Approved",
  });

  const populatedReview = await Review.findById(review._id)
    .populate("user", "username profileImage")
    .populate("product", "name");

  res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    review: populatedReview,
  });
});

// Get Approved Reviews for a Product
module.exports.getProductReviews = wrapAsync(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ExpressError(404, "Product not found");
  }

  const reviews = await Review.find({
    product: productId,
    status: "Approved",
  })
    .populate("user", "username profileImage")
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

  res.status(200).json({
    success: true,
    totalReviews,
    averageRating: Number(averageRating.toFixed(1)),
    reviews,
  });
});

// Get Logged-in User's Review for a Product
module.exports.getMyProductReview = wrapAsync(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ExpressError(404, "Product not found");
  }

  const review = await Review.findOne({
    user: userId,
    product: productId,
  })
    .populate("user", "username profileImage")
    .populate("product", "name");

  if (!review) {
    return res.status(200).json({
      success: true,
      review: null,
      message: "You have not reviewed this product yet",
    });
  }

  res.status(200).json({
    success: true,
    review,
  });
});

// Update Own Review
module.exports.updateReview = wrapAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ExpressError(404, "Review not found");
  }

  if (review.user.toString() !== userId.toString()) {
    throw new ExpressError(403, "You can only update your own review");
  }

  if (rating === undefined && comment === undefined) {
    throw new ExpressError(400, "Please provide a rating or comment to update");
  }

  if (rating !== undefined) {
    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new ExpressError(400, "Rating must be between 1 and 5");
    }

    review.rating = numericRating;
  }

  if (comment !== undefined) {
    if (typeof comment !== "string" || !comment.trim()) {
      throw new ExpressError(400, "Comment cannot be empty");
    }

    if (comment.trim().length > 2000) {
      throw new ExpressError(
        400,
        "Review comment cannot exceed 2000 characters",
      );
    }

    review.comment = comment.trim();
  }

  // Reviews remain approved after editing
  review.status = "Approved";

  await review.save();

  const updatedReview = await Review.findById(review._id)
    .populate("user", "username profileImage")
    .populate("product", "name");

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    review: updatedReview,
  });
});

// Delete Own Review
module.exports.deleteReview = wrapAsync(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ExpressError(404, "Review not found");
  }

  if (review.user.toString() !== userId.toString()) {
    throw new ExpressError(403, "You can only delete your own review");
  }

  await Review.findByIdAndDelete(reviewId);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

// Admin: Get All Reviews with Search, Filters and Pagination

module.exports.getAllReviews = wrapAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const { search } = req.query;

  const filter = {};

  // Search reviews by product name
  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const matchingProducts = await Product.find({
      name: { $regex: escapedSearch, $options: "i" },
    }).select("_id");

    filter.product = {
      $in: matchingProducts.map((product) => product._id),
    };
  }

  const totalReviews = await Review.countDocuments(filter);

  const reviews = await Review.find(filter)
    .populate("user", "username profileImage")
    .populate("product", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    reviews,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews,
      limit,
    },
  });
});

// Admin: Delete Any Review
module.exports.adminDeleteReview = wrapAsync(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findByIdAndDelete(reviewId);

  if (!review) {
    throw new ExpressError(404, "Review not found");
  }

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});
