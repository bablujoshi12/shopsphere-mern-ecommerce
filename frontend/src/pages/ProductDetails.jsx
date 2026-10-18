import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCartShopping,
  faBolt,
  faHeart,
  faMinus,
  faPlus,
  faComment,
  faEllipsisVertical,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import BACKEND_URL from "../config/api";
import { toast } from "react-toastify";

function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);

  // Wishlist
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReviewLoading, setMyReviewLoading] = useState(false);
  const [showReviewActions, setShowReviewActions] = useState(false);
  const [reviewDeleting, setReviewDeleting] = useState(false);
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);

  const [reviewSummary, setReviewSummary] = useState({
    totalReviews: 0,
    averageRating: 0,
  });

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  const getToken = () => localStorage.getItem("token");

  // Fetch Product
  const getProduct = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/products/${id}`);
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Unable to fetch product.");
        return;
      }

      setProduct(result.product);
      setQuantity(1);
    } catch (error) {
      toast.error("Something went wrong while fetching product.");
    }
  };

  // Fetch Wishlist Status
  const getWishlistStatus = async () => {
    const token = getToken();

    if (!token) {
      setIsWishlisted(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/wishlist`, {
        headers: {
          Authorization: token,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return;
      }

      const wishlistProducts = result.wishlist?.products || [];

      setIsWishlisted(
        wishlistProducts.some((item) => String(item._id) === String(id)),
      );
    } catch (error) {
      console.error("Unable to fetch wishlist status:", error);
    }
  };

  // Add or Remove Product from Wishlist
  const handleWishlistToggle = async () => {
    const token = getToken();

    if (!token) {
      toast.error("Please login to manage your wishlist.");
      navigate("/login");
      return;
    }

    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);

      const response = await fetch(`${BACKEND_URL}/wishlist/${id}`, {
        method: isWishlisted ? "DELETE" : "POST",
        headers: {
          Authorization: token,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Unable to update wishlist.");
        return;
      }

      setIsWishlisted((previous) => !previous);

      toast.success(
        result.message ||
          (isWishlisted ? "Removed from wishlist" : "Added to wishlist"),
      );
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setWishlistLoading(false);
    }
  };

  // Fetch Approved Product Reviews
  const getProductReviews = async () => {
    try {
      setReviewsLoading(true);

      const response = await fetch(`${BACKEND_URL}/reviews/product/${id}`);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to fetch reviews.");
      }

      setReviews(Array.isArray(result.reviews) ? result.reviews : []);

      setReviewSummary({
        totalReviews: Number(result.totalReviews || 0),
        averageRating: Number(result.averageRating || 0),
      });
    } catch (error) {
      toast.error(error.message || "Unable to load reviews.");
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch My Review
  const getMyProductReview = async () => {
    const token = getToken();

    if (!token) {
      setMyReview(null);
      return;
    }

    try {
      setMyReviewLoading(true);

      const response = await fetch(`${BACKEND_URL}/reviews/my/${id}`, {
        headers: {
          authorization: token,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to fetch your review.");
      }

      setMyReview(result.review || null);
    } catch (error) {
      toast.error(error.message || "Unable to fetch your review.");
    } finally {
      setMyReviewLoading(false);
    }
  };

  useEffect(() => {
    getProduct();
  }, [id]);

  useEffect(() => {
    getProductReviews();
    getMyProductReview();
    getWishlistStatus();
  }, [id]);

  // Open Create Review Modal
  const openCreateReviewModal = () => {
    if (!getToken()) {
      toast.error("Please login to write a review.");
      navigate("/login");
      return;
    }

    setEditingReview(null);
    setReviewRating(5);
    setReviewComment("");
    setShowReviewModal(true);
  };

  // Open Edit Review Modal
  const openEditReviewModal = (review) => {
    setEditingReview(review);
    setReviewRating(review.rating || 5);
    setReviewComment(review.comment || "");
    setShowReviewModal(true);
  };

  // Close Review Modal
  const closeReviewModal = () => {
    if (reviewSaving) return;

    setShowReviewModal(false);
    setEditingReview(null);
    setReviewRating(5);
    setReviewComment("");
  };

  // Create or Update Review
  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      toast.error("Please login to submit a review.");
      navigate("/login");
      return;
    }

    const trimmedComment = reviewComment.trim();

    if (trimmedComment.length < 3) {
      toast.error("Review must be at least 3 characters long.");
      return;
    }

    try {
      setReviewSaving(true);

      const isEditing = Boolean(editingReview);

      const url = isEditing
        ? `${BACKEND_URL}/reviews/${editingReview._id}`
        : `${BACKEND_URL}/reviews`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          productId: id,
          rating: Number(reviewRating),
          comment: trimmedComment,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to save review.");
      }

      toast.success(
        result.message ||
          (isEditing
            ? "Review updated successfully."
            : "Review submitted successfully."),
      );

      setShowReviewModal(false);
      setEditingReview(null);
      setReviewRating(5);
      setReviewComment("");

      await Promise.all([getProductReviews(), getMyProductReview()]);
    } catch (error) {
      toast.error(error.message || "Unable to save review.");
    } finally {
      setReviewSaving(false);
    }
  };

  // Delete Own Review
  const handleDeleteMyReview = async () => {
    if (!myReview || reviewDeleting) return;

    const token = getToken();

    if (!token) {
      toast.error("Please login to delete your review.");
      navigate("/login");
      return;
    }

    try {
      setReviewDeleting(true);

      const response = await fetch(`${BACKEND_URL}/reviews/${myReview._id}`, {
        method: "DELETE",
        headers: {
          authorization: token,
        },
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to delete review.");
      }

      toast.success(result.message || "Review deleted successfully.");

      setMyReview(null);
      setShowReviewActions(false);
      setShowDeleteReviewModal(false);

      await Promise.all([getProductReviews(), getMyProductReview()]);
    } catch (error) {
      toast.error(error.message || "Unable to delete review.");
    } finally {
      setReviewDeleting(false);
    }
  };

  // Add Product to Cart
  const handleAddToCart = async () => {
    const token = getToken();

    if (!token) {
      toast.error("Please login before adding products to cart.");
      navigate("/login");
      return;
    }

    if (quantity < 1 || quantity > product.stock) {
      toast.error("Please select a valid quantity.");
      return;
    }

    try {
      setCartLoading(true);

      const response = await fetch(`${BACKEND_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Unable to add product to cart.");
        return;
      }

      toast.success(result.message || "Product added to cart!");
      navigate("/cart");
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setCartLoading(false);
    }
  };

  // Buy Now
  const handleBuyNow = async () => {
    const token = getToken();

    if (!token) {
      toast.error("Please login before buying a product.");
      navigate("/login");
      return;
    }

    if (quantity < 1 || quantity > product.stock) {
      toast.error("Please select a valid quantity.");
      return;
    }

    try {
      setBuyLoading(true);

      const response = await fetch(`${BACKEND_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Unable to add product to cart.");
        return;
      }

      navigate("/checkout");
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setBuyLoading(false);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((previous) => Math.max(1, previous - 1));
  };

  const increaseQuantity = () => {
    setQuantity((previous) =>
      Math.min(Number(product?.stock) || 1, previous + 1),
    );
  };

  if (!product) {
    return (
      <main className="py-5">
        <div className="container text-center">
          <p className="text-muted">Loading product...</p>
        </div>
      </main>
    );
  }

  const isOutOfStock = Number(product.stock) <= 0;

  return (
    <main className="py-5">
      <div className="container">
        {/* Product Section */}
        <div className="row g-4 g-lg-5 align-items-start">
          <div className="col-lg-5">
            <div className="bg-light rounded-4 p-3 text-center">
              <img
                src={
                  product.images?.[0] ||
                  "https://placehold.co/700x550/f8f9fa/0d6efd?text=Product+Image"
                }
                alt={product.name}
                className="img-fluid rounded-3"
              />
            </div>

            <div className="row g-3 mt-2">
              {[1, 2, 3, 4].map((item) => (
                <div className="col-3" key={item}>
                  <div className="border rounded p-2 text-center">
                    <img
                      src={
                        product.images?.[item - 1] ||
                        "https://placehold.co/150x120/f8f9fa/0d6efd?text=Product"
                      }
                      alt="Product thumbnail"
                      className="img-fluid"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-7">
            <span
              className={`badge ${
                !isOutOfStock ? "bg-success" : "bg-danger"
              } mb-3`}
            >
              {!isOutOfStock ? "In Stock" : "Out of Stock"}
            </span>

            <h1 className="fw-bold display-6 mb-3">{product.name}</h1>

            {/* Dynamic Rating */}
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="text-warning">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesomeIcon
                    icon={faStar}
                    key={star}
                    className={
                      star <= Math.round(reviewSummary.averageRating)
                        ? ""
                        : "text-secondary opacity-25"
                    }
                  />
                ))}
              </span>

              <span className="text-muted">
                {reviewSummary.totalReviews > 0
                  ? `${reviewSummary.averageRating.toFixed(1)} (${reviewSummary.totalReviews} reviews)`
                  : "No reviews yet"}
              </span>
            </div>

            {/* Price */}
            <div className="mb-4">
              <span className="fs-3 fw-bold text-primary">
                ₹{product.discountPrice || product.price}
              </span>

              {product.discountPrice != null && (
                <>
                  <span className="text-muted text-decoration-line-through ms-3 fs-5">
                    ₹{product.price}
                  </span>
                  <span className="badge bg-danger ms-3">Sale</span>
                </>
              )}
            </div>

            <p className="text-muted lh-lg">{product.description}</p>

            <hr className="my-4" />

            {/* Quantity */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Quantity</h6>

              <div
                className="d-inline-flex align-items-center border rounded-3 overflow-hidden"
                style={{ height: "44px" }}
              >
                <button
                  className="btn btn-light rounded-0 px-3 h-100"
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>

                <span
                  className="px-4 fw-semibold text-center"
                  style={{ minWidth: "65px" }}
                >
                  {quantity}
                </span>

                <button
                  className="btn btn-light rounded-0 px-3 h-100"
                  type="button"
                  onClick={increaseQuantity}
                  disabled={isOutOfStock || quantity >= product.stock}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>

              <small className="text-muted d-block mt-2">
                {isOutOfStock
                  ? "Currently out of stock"
                  : `${product.stock} items available`}
              </small>

              <div className="mt-3">
                <span className="text-muted">Selected total: </span>
                <strong className="text-primary">
                  ₹
                  {(
                    Number(product.discountPrice || product.price) * quantity
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-primary px-4 py-2"
                onClick={handleAddToCart}
                disabled={isOutOfStock || cartLoading || buyLoading}
              >
                <FontAwesomeIcon icon={faCartShopping} className="me-2" />
                {cartLoading ? "Adding..." : "Add to Cart"}
              </button>

              <button
                type="button"
                className="btn btn-warning px-4 py-2"
                onClick={handleBuyNow}
                disabled={isOutOfStock || buyLoading || cartLoading}
              >
                <FontAwesomeIcon icon={faBolt} className="me-2" />
                {buyLoading ? "Please wait..." : "Buy Now"}
              </button>

              {/* Functional Wishlist Button */}
              <button
                type="button"
                className={`btn ${
                  isWishlisted ? "btn-danger" : "btn-outline-danger"
                } px-3 py-2`}
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
                title={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                {wishlistLoading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <FontAwesomeIcon icon={faHeart} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-5 pt-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "description" ? "active" : ""
                }`}
                onClick={() => setActiveTab("description")}
              >
                Description
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "specifications" ? "active" : ""
                }`}
                onClick={() => setActiveTab("specifications")}
              >
                Specifications
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "reviews" ? "active" : ""
                }`}
                onClick={() => setActiveTab("reviews")}
              >
                Reviews ({reviewSummary.totalReviews})
              </button>
            </li>
          </ul>

          <div className="border border-top-0 rounded-bottom p-3 p-md-4">
            {activeTab === "description" && (
              <div>
                <h5 className="fw-bold mb-3">Product Description</h5>
                <p className="text-muted lh-lg mb-0">{product.description}</p>
              </div>
            )}

            {activeTab === "specifications" && (
              <div>
                <h5 className="fw-bold mb-4">Product Specifications</h5>

                {product.specifications &&
                Object.keys(product.specifications).length > 0 ? (
                  <div className="row g-3">
                    {Object.entries(product.specifications).map(
                      ([key, value]) => (
                        <div className="col-md-6" key={key}>
                          <div className="d-flex justify-content-between border-bottom pb-2 gap-3">
                            <span className="text-muted text-capitalize">
                              {key}
                            </span>
                            <span className="fw-semibold text-break">
                              {value}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-muted mb-0">
                    No specifications available.
                  </p>
                )}
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div>
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
                  <div>
                    <h5 className="fw-bold mb-1">Customer Reviews</h5>
                    <p className="text-muted mb-0">
                      Read customer feedback about this product.
                    </p>
                  </div>

                  {!myReview && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={openCreateReviewModal}
                      disabled={myReviewLoading}
                    >
                      <FontAwesomeIcon icon={faComment} className="me-2" />
                      {myReviewLoading ? "Checking..." : "Write a Review"}
                    </button>
                  )}
                </div>

                {myReview && (
                  <div className="border rounded-3 p-3 p-md-4 mb-4">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-2">Your Review</h6>
                        <div className="text-warning small mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FontAwesomeIcon
                              key={star}
                              icon={faStar}
                              className={
                                star <= myReview.rating
                                  ? ""
                                  : "text-secondary opacity-25"
                              }
                            />
                          ))}
                          <span className="text-muted ms-2">
                            {myReview.rating}/5
                          </span>
                        </div>
                        <p className="text-muted mb-0 text-break">
                          {myReview.comment}
                        </p>
                      </div>

                      <div className="dropdown flex-shrink-0 position-relative">
                        <button
                          type="button"
                          className="btn btn-light border"
                          aria-label="Review options"
                          title="Review options"
                          disabled={reviewDeleting}
                          onClick={() =>
                            setShowReviewActions((previous) => !previous)
                          }
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </button>

                        {showReviewActions && (
                          <div className="dropdown-menu dropdown-menu-end show position-absolute">
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => {
                                setShowReviewActions(false);
                                openEditReviewModal(myReview);
                              }}
                            >
                              <FontAwesomeIcon icon={faPen} className="me-2" />
                              Edit
                            </button>

                            <button
                              type="button"
                              className="dropdown-item text-danger"
                              disabled={reviewDeleting}
                              onClick={() => {
                                setShowReviewActions(false);
                                setShowDeleteReviewModal(true);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="me-2"
                              />
                              {reviewDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {reviewSummary.totalReviews > 0 && (
                  <div className="bg-light rounded-3 p-3 mb-4 d-flex align-items-center gap-3">
                    <div className="text-center">
                      <div className="display-6 fw-bold">
                        {reviewSummary.averageRating.toFixed(1)}
                      </div>

                      <div className="text-warning small">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FontAwesomeIcon
                            icon={faStar}
                            key={star}
                            className={
                              star <= Math.round(reviewSummary.averageRating)
                                ? ""
                                : "text-secondary opacity-25"
                            }
                          />
                        ))}
                      </div>

                      <small className="text-muted">
                        {reviewSummary.totalReviews} reviews
                      </small>
                    </div>
                  </div>
                )}

                {reviewsLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm me-2" />
                    Loading reviews...
                  </div>
                ) : reviews.filter((review) => review._id !== myReview?._id)
                    .length === 0 ? (
                  <div className="text-center border rounded-3 p-4 p-md-5 bg-light">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white border mb-3"
                      style={{ width: "64px", height: "64px" }}
                    >
                      <FontAwesomeIcon
                        icon={faComment}
                        size="lg"
                        className="text-primary"
                      />
                    </div>

                    {myReview ? (
                      <>
                        <h5 className="fw-bold mb-2">
                          You're the first to review!
                        </h5>
                        <p className="text-muted mb-0">
                          Your review is shown above. Other customer reviews
                          will appear here when available.
                        </p>
                      </>
                    ) : (
                      <>
                        <h5 className="fw-bold mb-2">No Reviews Yet</h5>
                        <p className="text-muted mb-0">
                          Be the first to share your experience with this
                          product.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {reviews
                      .filter((review) => review._id !== myReview?._id)
                      .map((review) => (
                        <div
                          className="border rounded-3 p-3 p-md-4"
                          key={review._id}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-3">
                            <div>
                              <h6 className="fw-bold mb-1">
                                {review.user?.username || "Customer"}
                              </h6>

                              <div className="text-warning small mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FontAwesomeIcon
                                    key={star}
                                    icon={faStar}
                                    className={
                                      star <= review.rating
                                        ? ""
                                        : "text-secondary opacity-25"
                                    }
                                  />
                                ))}

                                <span className="text-muted ms-2">
                                  {review.rating}/5
                                </span>
                              </div>
                            </div>

                            <small className="text-muted text-nowrap">
                              {review.createdAt
                                ? new Date(review.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : ""}
                            </small>
                          </div>

                          <p className="text-muted mb-0 text-break">
                            {review.comment}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Review Confirmation Modal */}
      {showDeleteReviewModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteReviewModalTitle"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5
                    className="modal-title fw-bold"
                    id="deleteReviewModalTitle"
                  >
                    Delete Review
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDeleteReviewModal(false)}
                    disabled={reviewDeleting}
                    aria-label="Close"
                  />
                </div>

                <div className="modal-body">
                  <p className="mb-1">
                    Are you sure you want to delete your review?
                  </p>
                  <small className="text-muted">
                    This action cannot be undone.
                  </small>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowDeleteReviewModal(false)}
                    disabled={reviewDeleting}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteMyReview}
                    disabled={reviewDeleting}
                  >
                    {reviewDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Review"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Create / Edit Review Modal */}
      {showReviewModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reviewModalTitle"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeReviewModal();
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title fw-bold" id="reviewModalTitle">
                      {editingReview ? "Edit Your Review" : "Write a Review"}
                    </h5>
                    <p className="text-muted small mb-0">{product.name}</p>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeReviewModal}
                    disabled={reviewSaving}
                    aria-label="Close"
                  />
                </div>

                <form onSubmit={handleReviewSubmit}>
                  <div className="modal-body">
                    <label className="form-label fw-semibold">
                      Your Rating
                    </label>

                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="d-flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            className="btn btn-link p-0 text-decoration-none"
                            style={{ fontSize: "1.8rem" }}
                            onClick={() => setReviewRating(star)}
                            aria-label={`Rate ${star} out of 5`}
                          >
                            <FontAwesomeIcon
                              icon={faStar}
                              className={
                                star <= reviewRating
                                  ? "text-warning"
                                  : "text-secondary opacity-25"
                              }
                            />
                          </button>
                        ))}
                      </div>

                      <span className="text-muted">{reviewRating}/5</span>
                    </div>

                    <label
                      htmlFor="reviewComment"
                      className="form-label fw-semibold"
                    >
                      Your Review
                    </label>

                    <textarea
                      id="reviewComment"
                      className="form-control"
                      rows="5"
                      maxLength={1000}
                      placeholder="Share your experience with this product..."
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      required
                      minLength={3}
                    />

                    <div className="d-flex justify-content-between mt-2">
                      <small className="text-muted">
                        Keep your review helpful and respectful.
                      </small>
                      <small className="text-muted">
                        {reviewComment.length}/1000
                      </small>
                    </div>

                    <div className="alert alert-info small mt-3 mb-0">
                      {editingReview
                        ? "Your updated review will be saved immediately."
                        : "Your review will be visible to other customers immediately."}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeReviewModal}
                      disabled={reviewSaving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={reviewSaving || !reviewComment.trim()}
                    >
                      {reviewSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving...
                        </>
                      ) : editingReview ? (
                        "Update Review"
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </main>
  );
}

export default ProductDetails;
