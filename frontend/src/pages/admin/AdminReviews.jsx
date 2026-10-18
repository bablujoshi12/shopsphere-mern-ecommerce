import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faStar,
  faEye,
  faTrash,
  faChevronLeft,
  faChevronRight,
  faUser,
  faRotateRight,
  faComment,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import BACKEND_URL from "../../config/api";
import { toast } from "react-toastify";
import AdminLayout from "../../components/admin/AdminLayout";

const LIMIT = 10;

function AdminReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("all");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalReviews: 0,
    limit: LIMIT,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { authorization: token } : {};
  };

  // Fetch reviews
  useEffect(() => {
    const controller = new AbortController();

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          limit: String(LIMIT),
        });

        if (rating !== "all") params.set("rating", rating);
        if (search.trim()) params.set("search", search.trim());

        const response = await fetch(
          `${BACKEND_URL}/reviews/admin?${params.toString()}`,
          {
            headers: getHeaders(),
            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Reviews fetch nahi ho paye.");
        }

        setReviews(Array.isArray(result.reviews) ? result.reviews : []);

        setPagination(
          result.pagination || {
            currentPage: page,
            totalPages: 0,
            totalReviews: 0,
            limit: LIMIT,
          },
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => controller.abort();
  }, [page, rating, search, refreshKey]);

  // Filter handlers
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setRating("all");
    setPage(1);
  };

  // Delete review
  const handleDeleteReview = async (review) => {
    const confirmed = window.confirm(
      "Kya tum is customer review ko permanently delete karna chahte ho?",
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `${BACKEND_URL}/reviews/admin/${review._id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        },
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Review delete nahi ho paya.");
      }

      toast.success(result.message || "Review deleted successfully.");

      if (selectedReview?._id === review._id) {
        setShowModal(false);
        setSelectedReview(null);
      }

      // Avoid an empty page after deleting its last review
      if (reviews.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        setRefreshKey((previous) => previous + 1);
      }
    } catch (err) {
      toast.error(err.message || "Review delete nahi ho paya.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const closeModal = () => {
    if (actionLoading) return;
    setShowModal(false);
    setSelectedReview(null);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const startNumber =
    pagination.totalReviews === 0 ? 0 : (page - 1) * LIMIT + 1;

  const endNumber = Math.min(page * LIMIT, pagination.totalReviews);

  // Admin can delete inappropriate reviews; approval is automatic.
  const renderReviewActions = (review, mobile = false) => (
    <button
      type="button"
      className="btn btn-sm btn-outline-danger"
      title="Delete review"
      disabled={actionLoading}
      onClick={() => handleDeleteReview(review)}
    >
      <FontAwesomeIcon icon={faTrash} />
      {mobile && <span className="ms-1">Delete</span>}
    </button>
  );

  return (
    <AdminLayout>
      <div className="container-fluid px-2 px-sm-3 px-lg-4 pt-3 pt-md-4 pb-3">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Reviews</h2>
            <p className="text-muted mb-0">Manage customer product reviews</p>
          </div>

          <span className="badge bg-primary fs-6 px-3 py-2 align-self-start align-self-sm-auto">
            {pagination.totalReviews} Reviews
          </span>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-2">
              <div className="col-12 col-lg">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>

                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search review comments..."
                    value={search}
                    onChange={(e) =>
                      handleFilterChange(setSearch, e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-2">
                <select
                  className="form-select"
                  value={rating}
                  onChange={(e) =>
                    handleFilterChange(setRating, e.target.value)
                  }
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div className="col-12 col-lg-auto">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2">
            <span>{error}</span>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger flex-shrink-0"
              onClick={() => setRefreshKey((previous) => previous + 1)}
            >
              <FontAwesomeIcon icon={faRotateRight} className="me-2" />
              Retry
            </button>
          </div>
        )}

        {/* Desktop Table */}
        <div className="card border-0 shadow-sm d-none d-md-block">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-3 py-3">Customer</th>
                  <th className="py-3">Product</th>
                  <th className="py-3">Rating</th>
                  <th className="py-3">Review</th>
                  <th className="py-3">Date</th>
                  <th className="text-end px-3 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="spinner-border spinner-border-sm me-2" />
                      Loading reviews...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <FontAwesomeIcon
                        icon={faComment}
                        size="2x"
                        className="text-muted mb-2"
                      />
                      <p className="mb-0">No reviews found.</p>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => {
                    return (
                      <tr key={review._id}>
                        <td className="px-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden"
                              style={{ width: 40, height: 40 }}
                            >
                              {review.user?.profileImage ? (
                                <img
                                  src={review.user.profileImage}
                                  alt={review.user.username || "Customer"}
                                  className="rounded-circle"
                                  style={{
                                    width: 40,
                                    height: 40,
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <FontAwesomeIcon icon={faUser} />
                              )}
                            </div>

                            <div>
                              <div className="fw-semibold">
                                {review.user?.username || "Unknown customer"}
                              </div>
                              <small className="text-muted">
                                {review.isVerifiedPurchase
                                  ? "Verified purchase"
                                  : "Customer"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="fw-semibold small">
                            {review.product?.name || "Product unavailable"}
                          </span>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <span className="text-warning">
                              <FontAwesomeIcon icon={faStar} />
                            </span>
                            <span className="fw-semibold">
                              {review.rating}.0
                            </span>
                          </div>
                        </td>

                        <td style={{ maxWidth: 280 }}>
                          <span
                            className="text-muted small d-block"
                            style={{
                              overflowWrap: "anywhere",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {review.comment}
                          </span>
                        </td>

                        <td>
                          <span className="text-muted small">
                            {formatDate(review.createdAt)}
                          </span>
                        </td>

                        <td className="text-end px-3">
                          <div className="d-inline-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="View review"
                              onClick={() => handleViewReview(review)}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>

                            {renderReviewActions(review)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            loading={loading}
            start={startNumber}
            end={endNumber}
            total={pagination.totalReviews}
            onPageChange={setPage}
          />
        </div>

        {/* Mobile Cards */}
        <div className="d-md-none">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm me-2" />
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <FontAwesomeIcon
                  icon={faComment}
                  size="2x"
                  className="text-muted mb-2"
                />
                <p className="mb-0">No reviews found.</p>
              </div>
            </div>
          ) : (
            reviews.map((review) => {
              return (
                <div className="card border-0 shadow-sm mb-3" key={review._id}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden"
                          style={{ width: 40, height: 40 }}
                        >
                          {review.user?.profileImage ? (
                            <img
                              src={review.user.profileImage}
                              alt={review.user.username || "Customer"}
                              className="rounded-circle"
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <FontAwesomeIcon icon={faUser} />
                          )}
                        </div>

                        <div>
                          <h6 className="fw-semibold mb-1">
                            {review.user?.username || "Unknown customer"}
                          </h6>
                          <small className="text-muted">
                            {review.isVerifiedPurchase
                              ? "Verified purchase"
                              : "Customer"}
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <small className="text-muted d-block">Product</small>
                      <span className="fw-semibold small">
                        {review.product?.name || "Product unavailable"}
                      </span>
                    </div>

                    <div className="mt-2">
                      <small className="text-muted d-block">Rating</small>
                      <span className="text-warning me-1">
                        <FontAwesomeIcon icon={faStar} />
                      </span>
                      <span className="fw-semibold">{review.rating}.0 / 5</span>
                    </div>

                    <div className="bg-light rounded p-2 mt-3">
                      <small className="text-muted d-block mb-1">Review</small>
                      <span className="small text-break">{review.comment}</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center gap-2 mt-3 pt-3 border-top">
                      <small className="text-muted flex-shrink-0">
                        {formatDate(review.createdAt)}
                      </small>

                      <div className="d-flex align-items-center gap-2 flex-nowrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewReview(review)}
                        >
                          <FontAwesomeIcon icon={faEye} className="me-1" />
                          View
                        </button>

                        {renderReviewActions(review, true)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-2">
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                loading={loading}
                start={startNumber}
                end={endNumber}
                total={pagination.totalReviews}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>

        {/* View Review Modal */}
        {showModal && selectedReview && (
          <div
            className="review-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div className="review-modal-dialog">
              <div className="review-modal-content">
                <div className="d-flex justify-content-between align-items-center border-bottom p-3 p-md-4">
                  <div>
                    <h5 className="fw-bold mb-1">Review Details</h5>
                    <small className="text-muted">
                      Customer product review
                    </small>
                  </div>
                </div>

                <div className="review-modal-body p-3 p-md-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 52, height: 52 }}
                    >
                      <FontAwesomeIcon icon={faUser} size="lg" />
                    </div>

                    <div>
                      <h6 className="fw-bold mb-1 text-break">
                        {selectedReview.user?.username || "Unknown customer"}
                      </h6>
                      <small className="text-muted">
                        {selectedReview.isVerifiedPurchase
                          ? "Verified purchase"
                          : "Not marked as verified"}
                      </small>
                    </div>
                  </div>

                  <div className="row g-3">
                    {[
                      [
                        "Product",
                        selectedReview.product?.name || "Product unavailable",
                      ],
                      ["Rating", `${selectedReview.rating} / 5`],
                      ["Date", formatDate(selectedReview.createdAt)],
                      ["Review ID", selectedReview._id],
                    ].map(([label, value]) => (
                      <div className="col-12 col-sm-6" key={label}>
                        <div className="bg-light rounded p-3 h-100">
                          <small className="text-muted d-block">{label}</small>
                          <span className="fw-semibold text-break">
                            {value}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="col-12">
                      <div className="bg-light rounded p-3">
                        <small className="text-muted d-block mb-2">
                          Customer Comment
                        </small>
                        <p className="mb-0 text-break">
                          {selectedReview.comment}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                      disabled={actionLoading}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Styles */}
        <style>{`
        .review-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1060;
          background: rgba(15, 23, 42, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .review-modal-dialog {
          width: 100%;
          max-width: 650px;
          max-height: 100%;
          margin: auto;
        }

        .review-modal-content {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .review-modal-body {
          max-height: calc(100vh - 150px);
          overflow-y: auto;
        }

        @media (max-width: 576px) {
          .review-modal-overlay {
            padding: 8px;
          }

          .review-modal-body {
            max-height: calc(100vh - 125px);
          }
        }
      `}</style>
      </div>
    </AdminLayout>
  );
}

function Pagination({
  page,
  totalPages,
  loading,
  start,
  end,
  total,
  onPageChange,
}) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 py-3 px-3">
      <small className="text-muted">
        Showing {start}–{end} of {total} reviews
      </small>

      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={page <= 1 || loading || totalPages === 0}
          onClick={() => onPageChange((current) => current - 1)}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <span className="small">
          Page {totalPages === 0 ? 0 : page} of {totalPages}
        </span>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={page >= totalPages || loading || totalPages === 0}
          onClick={() => onPageChange((current) => current + 1)}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}

export default AdminReviews;
