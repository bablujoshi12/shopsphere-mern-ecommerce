import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faCartShopping,
  faArrowRight,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BACKEND_URL from "../config/api";

function Wishlist() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  // Bootstrap Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch Wishlist
  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/wishlist`, {
        method: "GET",
        headers: {
          Authorization: token,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to load wishlist");
        return;
      }

      setProducts(result.wishlist?.products || []);
    } catch (error) {
      toast.error("Unable to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Open Delete Modal
  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  // Close Delete Modal
  const closeDeleteModal = () => {
    if (removingId !== null) return;

    setShowDeleteModal(false);
    setSelectedProduct(null);
  };

  // Remove Product from Wishlist
  const handleRemove = async () => {
    if (!selectedProduct || removingId !== null) return;

    const productId = selectedProduct._id;
    setRemovingId(productId);

    try {
      const response = await fetch(`${BACKEND_URL}/wishlist/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to remove product");
        return;
      }

      setProducts((previous) =>
        previous.filter((product) => product._id !== productId),
      );

      setShowDeleteModal(false);
      setSelectedProduct(null);

      toast.success(result.message || "Product removed from wishlist");
    } catch (error) {
      toast.error("Unable to remove product");
    } finally {
      setRemovingId(null);
    }
  };

  // Continue Shopping
  const handleContinueShopping = () => {
    navigate("/products");
  };

  // Loading State
  if (loading) {
    return (
      <main className="wishlist-page py-5">
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading your wishlist...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-page py-5">
      <div className="container">
        {/* Header */}
        <div className="wishlist-top mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="wishlist-title-icon">
                <FontAwesomeIcon icon={faHeart} />
              </div>

              <h2 className="fw-bold mb-0">My Wishlist</h2>
            </div>

            <p className="text-muted mb-0">Products you've saved for later</p>
          </div>

          <div className="wishlist-items-count">
            <strong>{products.length}</strong>
            <span>Saved Items</span>
          </div>
        </div>

        {/* Empty Wishlist */}
        {products.length === 0 ? (
          <div className="text-center py-5">
            <FontAwesomeIcon
              icon={faHeart}
              className="text-muted mb-3"
              style={{ fontSize: "3rem" }}
            />

            <h4 className="fw-bold">Your wishlist is empty</h4>

            <p className="text-muted">
              Save your favourite products here for later.
            </p>

            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={handleContinueShopping}
            >
              Explore Products
              <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </button>
          </div>
        ) : (
          <>
            {/* Products */}
            <div className="row g-4">
              {products.map((product) => {
                const originalPrice = Number(product.price);

                const finalPrice =
                  product.discountPrice != null
                    ? Number(product.discountPrice)
                    : originalPrice;

                const hasDiscount = finalPrice < originalPrice;

                const discount = hasDiscount
                  ? Math.round(
                      ((originalPrice - finalPrice) / originalPrice) * 100,
                    )
                  : 0;

                const image = product.images?.[0];

                return (
                  <div
                    className="col-12 col-sm-6 col-lg-4 col-xl-3"
                    key={product._id}
                  >
                    <div className="wishlist-product-card h-100">
                      {/* Product Image */}
                      <div className="wishlist-product-image">
                        <button
                          type="button"
                          className="border-0 bg-transparent p-0 w-100 h-100"
                          onClick={() => navigate(`/products/${product._id}`)}
                          aria-label={`View ${product.name}`}
                        >
                          {image ? (
                            <img src={image} alt={product.name} />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                              No Image
                            </div>
                          )}
                        </button>

                        {/* Discount Badge */}
                        {hasDiscount && (
                          <span className="wishlist-sale-badge">
                            {discount}% OFF
                          </span>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="wishlist-heart-btn"
                          title="Remove from wishlist"
                          aria-label={`Remove ${product.name} from wishlist`}
                          onClick={() => openDeleteModal(product)}
                          disabled={removingId !== null}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>

                      {/* Product Details */}
                      <div className="wishlist-product-body">
                        <h5
                          className="wishlist-product-title"
                          role="button"
                          onClick={() => navigate(`/products/${product._id}`)}
                        >
                          {product.name}
                        </h5>

                        <p className="wishlist-product-description">
                          {product.description}
                        </p>

                        {product.brand && (
                          <p className="small text-muted mb-2">
                            Brand: {product.brand}
                          </p>
                        )}

                        {/* Price */}
                        <div className="wishlist-product-price">
                          <strong>₹{finalPrice.toLocaleString("en-IN")}</strong>

                          {hasDiscount && (
                            <span>
                              ₹{originalPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>

                        {/* Stock */}
                        {product.stock <= 0 && (
                          <p className="text-danger small mt-2 mb-2">
                            Out of stock
                          </p>
                        )}

                        {/* View Product */}
                        <button
                          type="button"
                          className="btn btn-primary w-100 wishlist-cart-btn"
                          onClick={() => navigate(`/products/${product._id}`)}
                        >
                          <FontAwesomeIcon
                            icon={faCartShopping}
                            className="me-2"
                          />
                          View Product
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Shopping */}
            <div className="wishlist-bottom">
              <button
                type="button"
                className="btn btn-outline-primary px-4"
                onClick={handleContinueShopping}
              >
                Continue Shopping
                <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
              </button>
            </div>
          </>
        )}

        {/* Bootstrap Delete Confirmation Modal */}
        {showDeleteModal && selectedProduct && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              role="dialog"
              aria-modal="true"
              aria-labelledby="wishlistDeleteModalTitle"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeDeleteModal();
                }
              }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                  <div className="modal-header">
                    <h5
                      className="modal-title fw-bold"
                      id="wishlistDeleteModalTitle"
                    >
                      Remove from Wishlist
                    </h5>

                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={closeDeleteModal}
                      disabled={removingId !== null}
                    />
                  </div>

                  <div className="modal-body text-center py-4">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger mx-auto mb-3"
                      style={{ width: "64px", height: "64px" }}
                    >
                      <FontAwesomeIcon icon={faTrash} size="lg" />
                    </div>

                    <h6 className="fw-semibold mb-2">Are you sure?</h6>

                    <p className="text-muted mb-0">
                      Do you want to remove{" "}
                      <strong>{selectedProduct.name}</strong> from your
                      wishlist?
                    </p>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeDeleteModal}
                      disabled={removingId !== null}
                    >
                      <FontAwesomeIcon icon={faXmark} className="me-2" />
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleRemove}
                      disabled={removingId !== null}
                    >
                      {removingId === selectedProduct._id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faTrash} className="me-2" />
                          Yes, Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-backdrop fade show" />
          </>
        )}
      </div>
    </main>
  );
}

export default Wishlist;
