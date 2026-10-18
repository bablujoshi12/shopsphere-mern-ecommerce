import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faArrowRight } from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL from "../../config/api";

function FeaturedProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch products from backend
  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(`${BACKEND_URL}/products`, {
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch products");
        }

        const productList = Array.isArray(result.products)
          ? result.products
          : Array.isArray(result.product)
            ? result.product
            : Array.isArray(result.data)
              ? result.data
              : [];

        const activeProducts = productList.filter(
          (product) => product.isActive !== false,
        );

        setProducts(activeProducts.slice(0, 4));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Featured products error:", err);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, []);

  // Get product image
  const getProductImage = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];

      return typeof firstImage === "string"
        ? firstImage
        : firstImage?.url || firstImage?.image || "";
    }

    if (Array.isArray(product.image) && product.image.length > 0) {
      const firstImage = product.image[0];

      return typeof firstImage === "string"
        ? firstImage
        : firstImage?.url || firstImage?.image || "";
    }

    if (typeof product.image === "string") {
      return product.image;
    }

    return "https://placehold.co/500x400/f8f9fa/0d6efd?text=Product";
  };

  // Get final product price
  const getProductPrice = (product) => {
    return product.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  };

  // Get product rating
  const getProductRating = (product) => {
    return product.averageRating ?? product.rating ?? null;
  };

  // Navigate to product details
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <section className="py-5 bg-light">
      <div className="container">
        {/* Section Heading */}
        <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold mb-1">Featured Products</h2>
            <p className="text-muted mb-0">Check out our popular products</p>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary flex-shrink-0"
            onClick={() => navigate("/products")}
          >
            View All
            <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading products...</span>
            </div>
            <p className="text-muted mt-3 mb-0">Loading products...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="alert alert-danger text-center" role="alert">
            Unable to load products. Please refresh the page and try again.
          </div>
        )}

        {/* Empty Products */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-5">
            <h5 className="fw-semibold">No products available</h5>
            <p className="text-muted mb-0">
              Products will appear here when they become available.
            </p>
          </div>
        )}

        {/* Featured Products */}
        {!loading && !error && products.length > 0 && (
          <div className="row g-4">
            {products.map((product) => {
              const price = getProductPrice(product);

              const hasDiscount =
                product.discountPrice > 0 &&
                product.discountPrice < product.price;

              const rating = getProductRating(product);
              const image = getProductImage(product);

              return (
                <div className="col-12 col-sm-6 col-lg-3" key={product._id}>
                  <div
                    className="card h-100 border-0 shadow-sm"
                    role="link"
                    tabIndex={0}
                    onClick={() => handleProductClick(product._id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleProductClick(product._id);
                      }
                    }}
                    style={{
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.transform = "translateY(-4px)";
                      event.currentTarget.classList.add("shadow");
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.transform = "translateY(0)";
                      event.currentTarget.classList.remove("shadow");
                    }}
                    aria-label={`View ${product.name} details`}
                  >
                    {/* Product Image */}
                    <div className="bg-white p-3 overflow-hidden">
                      <img
                        src={image}
                        alt={product.name}
                        className="img-fluid w-100 rounded"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://placehold.co/500x400/f8f9fa/0d6efd?text=Product";
                        }}
                        style={{
                          height: "220px",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="card-body">
                      <h5 className="fw-semibold mb-2">{product.name}</h5>

                      {rating !== null && rating !== undefined && (
                        <div className="text-warning mb-2">
                          <FontAwesomeIcon icon={faStar} />
                          <span className="text-dark ms-2">
                            {Number(rating).toFixed(1)}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="fw-bold fs-5">
                          ₹{Number(price || 0).toLocaleString("en-IN")}
                        </span>

                        {hasDiscount && (
                          <span className="text-muted text-decoration-line-through ms-2">
                            ₹{Number(product.price).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProducts;
