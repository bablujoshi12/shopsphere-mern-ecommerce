import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBagShopping,
  faTruckFast,
  faShieldHalved,
  faHeadset,
  faTags,
} from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL from "../../config/api";

function HeroSection() {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch active banners
  useEffect(() => {
    const controller = new AbortController();

    const fetchBanners = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(`${BACKEND_URL}/banners`, {
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch banners");
        }

        if (result.success && Array.isArray(result.banners)) {
          setBanners(result.banners);
          setActiveIndex(0);
        } else {
          setBanners([]);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Banner fetch error:", err);
          setError(true);
          setBanners([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBanners();

    return () => controller.abort();
  }, []);

  const currentBanner = banners[activeIndex];

  // Reset image error when banner changes
  useEffect(() => {
    setImageError(false);
  }, [currentBanner?._id, currentBanner?.image]);

  // Automatically change banner every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Shop Now redirect
  const handleBannerLink = () => {
    const link = currentBanner?.link;

    if (
      typeof link === "string" &&
      link.startsWith("/") &&
      !link.startsWith("//")
    ) {
      navigate(link);
    } else {
      navigate("/products");
    }
  };

  return (
    <>
      <style>{`
        .shopsphere-hero {
          background:
            radial-gradient(
              circle at 10% 15%,
              rgba(13, 110, 253, 0.07),
              transparent 30%
            ),
            linear-gradient(
              120deg,
              #f4f8ff 0%,
              #edf4ff 55%,
              #f8fbff 100%
            );
          overflow: hidden;
        }

        .shopsphere-hero-title {
          font-size: clamp(2rem, 3.2vw, 3.2rem);
          line-height: 1.15;
          letter-spacing: -1px;
          overflow-wrap: anywhere;
        }

        .shopsphere-hero-description {
          max-width: 500px;
          font-size: 1rem;
          line-height: 1.75;
        }

        .shopsphere-hero-media {
          width: 100%;
          height: 380px;
          overflow: hidden;
          border-radius: 20px;
          background: #e8eef7;
          box-shadow: 0 12px 30px rgba(24, 60, 110, 0.1);
        }

        .shopsphere-hero-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .shopsphere-hero-feature {
          min-width: 0;
        }

        .shopsphere-hero-feature-icon {
          font-size: 1.5rem;
        }

        .shopsphere-hero-dots button {
          border: 0;
          padding: 0;
          height: 9px;
          border-radius: 20px;
          transition: width 0.25s ease, background 0.25s ease;
        }

        @media (max-width: 991.98px) {
          .shopsphere-hero-title {
            font-size: clamp(2rem, 5vw, 2.8rem);
          }

          .shopsphere-hero-description {
            max-width: 100%;
          }

          .shopsphere-hero-media {
            height: 320px;
          }
        }

        @media (max-width: 575.98px) {
          .shopsphere-hero {
            padding-top: 1.5rem !important;
            padding-bottom: 1.5rem !important;
          }

          .shopsphere-hero-title {
            font-size: 2rem;
            line-height: 1.2;
            letter-spacing: -0.6px;
          }

          .shopsphere-hero-description {
            font-size: 0.95rem;
            line-height: 1.6;
          }

          .shopsphere-hero-media {
            height: 240px;
            border-radius: 16px;
          }

          .shopsphere-hero-badge {
            font-size: 0.72rem;
            white-space: normal;
            text-align: left;
          }

          .shopsphere-hero-actions {
            gap: 0.65rem !important;
          }

          .shopsphere-hero-actions .btn {
            font-size: 0.9rem;
            padding: 0.65rem 0.9rem !important;
          }

          .shopsphere-hero-feature-icon {
            font-size: 1.25rem;
          }

          .shopsphere-hero-feature p {
            font-size: 0.7rem;
            line-height: 1.3;
          }
        }
      `}</style>

      <section className="shopsphere-hero py-4 py-lg-5">
        <div className="container py-lg-3">
          <div className="row align-items-center g-4 g-lg-5">
            {/* Left Content */}
            <div className="col-lg-5">
              <span className="shopsphere-hero-badge badge bg-primary-subtle text-primary rounded-pill px-3 py-2 mb-3">
                <FontAwesomeIcon icon={faTags} className="me-2" />
                Your Everyday Shopping Destination
              </span>

              <h1 className="shopsphere-hero-title fw-bold mb-3">
                {currentBanner?.title || "Everything You Need,"}
                {!currentBanner?.title && (
                  <span className="text-primary"> All in One Place.</span>
                )}
              </h1>

              <p className="shopsphere-hero-description text-secondary mb-4">
                {currentBanner?.description ||
                  "Discover products you love, explore exciting deals and enjoy a simple, convenient shopping experience with ShopSphere."}
              </p>

              <div className="shopsphere-hero-actions d-flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-primary px-4 py-3 rounded-3"
                  onClick={handleBannerLink}
                >
                  <FontAwesomeIcon icon={faBagShopping} className="me-2" />
                  Shop Now
                </button>

                <button
                  type="button"
                  className="btn btn-outline-primary px-4 py-3 rounded-3"
                  onClick={() => navigate("/products")}
                >
                  Explore Products
                  <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </button>
              </div>

              {/* Shopping Highlights */}
              <div className="row g-2 mt-4 pt-2">
                <div className="col-4 shopsphere-hero-feature">
                  <FontAwesomeIcon
                    icon={faTruckFast}
                    className="shopsphere-hero-feature-icon text-primary mb-2"
                  />
                  <p className="fw-semibold small mb-0">Fast Delivery</p>
                </div>

                <div className="col-4 shopsphere-hero-feature border-start border-end">
                  <FontAwesomeIcon
                    icon={faShieldHalved}
                    className="shopsphere-hero-feature-icon text-primary mb-2"
                  />
                  <p className="fw-semibold small mb-0">Secure Shopping</p>
                </div>

                <div className="col-4 shopsphere-hero-feature">
                  <FontAwesomeIcon
                    icon={faHeadset}
                    className="shopsphere-hero-feature-icon text-primary mb-2"
                  />
                  <p className="fw-semibold small mb-0">Customer Support</p>
                </div>
              </div>
            </div>

            {/* Right Banner Image */}
            <div className="col-lg-7">
              <div className="position-relative">
                <div className="shopsphere-hero-media">
                  {loading ? (
                    <div className="h-100 d-flex align-items-center justify-content-center">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">
                          Loading banners...
                        </span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 bg-white">
                      <p className="text-danger mb-3">
                        Unable to load banners.
                      </p>

                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => window.location.reload()}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : currentBanner && !imageError ? (
                    <img
                      key={currentBanner._id}
                      src={currentBanner.image}
                      alt={currentBanner.title || "ShopSphere banner"}
                      className="shopsphere-hero-image"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 bg-white">
                      <FontAwesomeIcon
                        icon={faBagShopping}
                        className="text-primary fs-1 mb-3"
                      />

                      <p className="fw-semibold mb-1">
                        {currentBanner?.title || "Welcome to ShopSphere"}
                      </p>

                      <p className="text-muted small mb-0">
                        {imageError
                          ? "Banner image could not be loaded."
                          : "Your shopping journey starts here."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Banner Indicators - No side arrows */}
                {!loading && !error && banners.length > 1 && (
                  <div className="shopsphere-hero-dots d-flex justify-content-center gap-2 mt-3">
                    {banners.map((banner, index) => (
                      <button
                        key={banner._id}
                        type="button"
                        className={
                          index === activeIndex
                            ? "bg-primary"
                            : "bg-secondary opacity-50"
                        }
                        style={{
                          width: index === activeIndex ? "26px" : "9px",
                        }}
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Show banner ${index + 1}`}
                        aria-current={
                          index === activeIndex ? "true" : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroSection;
