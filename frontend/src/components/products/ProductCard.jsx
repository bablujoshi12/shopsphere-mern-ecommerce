import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

function ProductCard({ product }) {
  const navigate = useNavigate();

  const averageRating = Number(product.averageRating) || 0;

  return (
    <>
      <style>{`
        .product-card-image {
          height: 220px;
          object-fit: contain;
        }

        .product-card-description {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
          min-height: 0;
        }

        @media (min-width: 992px) {
          .product-card-image {
            height: 150px;
          }

          .product-card-body {
            padding: 0.75rem !important;
          }

          .product-card-title {
            font-size: 0.9rem !important;
          }

          .product-card-description {
            font-size: 0.8rem !important;
            margin-bottom: 0.5rem !important;
          }

          .product-card-rating {
            margin-bottom: 0.5rem !important;
            font-size: 0.85rem;
          }

          .product-card-price {
            margin-bottom: 0.75rem !important;
          }

          .product-card-price .current-price {
            font-size: 1.1rem !important;
          }

          .product-card-button {
            font-size: 0.85rem;
            padding: 0.4rem 0.5rem;
          }
        }
      `}</style>

      <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
        {/* Product Image */}
        <div className="position-relative bg-light">
          <img
            src={
              product.images?.[0] ||
              "https://placehold.co/500x400/f8f9fa/0d6efd?text=Product"
            }
            alt={product.name}
            className="img-fluid w-100 p-3 product-card-image"
            loading="lazy"
          />

          {product.discountPrice && (
            <span className="badge bg-danger position-absolute top-0 start-0 m-2">
              Sale
            </span>
          )}
        </div>

        {/* Product Details */}
        <div
          className="card-body d-flex flex-column p-3 product-card-body"
          role="button"
          onClick={() => navigate(`/products/${product._id}`)}
        >
          <h5 className="card-title fw-semibold mb-2 fs-6 product-card-title">
            {product.name}
          </h5>

          <p className="card-text text-muted small mb-3 product-card-description">
            {product.description}
          </p>

          {/* Average Rating */}
          <div className="mb-3 d-flex align-items-center flex-wrap gap-2 product-card-rating">
            <span className="text-warning">
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesomeIcon
                  key={star}
                  icon={faStar}
                  className={
                    star <= Math.round(averageRating)
                      ? ""
                      : "text-secondary opacity-25"
                  }
                />
              ))}
            </span>

            <span className="text-muted small">{averageRating.toFixed(1)}</span>
          </div>

          {/* Price */}
          <div className="mb-3 product-card-price">
            <span className="text-primary fw-bold fs-5 current-price">
              ₹{product.discountPrice || product.price}
            </span>

            {product.discountPrice && (
              <span className="text-muted text-decoration-line-through ms-2 small">
                ₹{product.price}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductCard;
