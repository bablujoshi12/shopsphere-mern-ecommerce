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
  faChevronLeft,
  faChevronRight,
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

  // Reset image error when banner changes
  const currentBanner = banners[activeIndex];

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

  const showPreviousBanner = () => {
    setActiveIndex((index) => (index === 0 ? banners.length - 1 : index - 1));
  };

  const showNextBanner = () => {
    setActiveIndex((index) => (index + 1) % banners.length);
  };

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
    <section className="py-5 bg-light">
      <div className="container">
        <div className="row align-items-center g-4 g-lg-5">
          {/* Left Content */}
          <div className="col-lg-6">
            <span className="badge bg-primary-subtle text-primary px-3 py-2 mb-3">
              <FontAwesomeIcon icon={faTags} className="me-2" />
              Your Everyday Shopping Destination
            </span>

            <h1 className="display-4 fw-bold mb-3">
              {currentBanner?.title || "Everything You Need,"}
              {!currentBanner?.title && (
                <span className="text-primary"> All in One Place.</span>
              )}
            </h1>

            <p className="lead text-secondary mb-4">
              {currentBanner?.description ||
                "Discover products you love, explore exciting deals and enjoy a simple, convenient shopping experience with ShopSphere."}
            </p>

            <div className="d-flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-primary btn-lg px-4"
                onClick={handleBannerLink}
              >
                <FontAwesomeIcon icon={faBagShopping} className="me-2" />
                Shop Now
              </button>

              <button
                type="button"
                className="btn btn-outline-primary btn-lg px-4"
                onClick={() => navigate("/products")}
              >
                Explore Products
                <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
              </button>
            </div>

            {/* Shopping Highlights */}
            <div className="row g-3 mt-4">
              <div className="col-4">
                <FontAwesomeIcon
                  icon={faTruckFast}
                  className="text-primary fs-4 mb-2"
                />
                <p className="fw-semibold small mb-0">Fast Delivery</p>
              </div>

              <div className="col-4">
                <FontAwesomeIcon
                  icon={faShieldHalved}
                  className="text-primary fs-4 mb-2"
                />
                <p className="fw-semibold small mb-0">Secure Shopping</p>
              </div>

              <div className="col-4">
                <FontAwesomeIcon
                  icon={faHeadset}
                  className="text-primary fs-4 mb-2"
                />
                <p className="fw-semibold small mb-0">Customer Support</p>
              </div>
            </div>
          </div>

          {/* Right Banner Carousel */}
          <div className="col-lg-6">
            <div className="position-relative">
              <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 overflow-hidden">
                {loading ? (
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{ height: "380px" }}
                  >
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">
                        Loading banners...
                      </span>
                    </div>
                  </div>
                ) : error ? (
                  <div
                    className="d-flex flex-column align-items-center justify-content-center text-center"
                    style={{ height: "380px" }}
                  >
                    <p className="text-danger mb-3">Unable to load banners.</p>
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
                    className="img-fluid rounded-4 w-100 d-block"
                    onError={() => setImageError(true)}
                    style={{
                      maxWidth: "100%",
                      height: "380px",
                      objectFit: "contain",
                    }}
                  />
                ) : !currentBanner ? (
                  <div
                    className="d-flex align-items-center justify-content-center text-center"
                    style={{ height: "380px" }}
                  >
                    <div>
                      <FontAwesomeIcon
                        icon={faBagShopping}
                        className="text-primary fs-1 mb-3"
                      />
                      <p className="fw-semibold mb-1">Welcome to ShopSphere</p>
                      <p className="text-muted small mb-0">
                        Your shopping journey starts here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center text-center"
                    style={{ height: "380px" }}
                  >
                    <div>
                      <FontAwesomeIcon
                        icon={faBagShopping}
                        className="text-primary fs-1 mb-3"
                      />
                      <p className="fw-semibold mb-1">
                        {currentBanner.title || "ShopSphere"}
                      </p>
                      <p className="text-muted small mb-0">
                        Banner image could not be loaded.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Previous / Next Buttons */}
              {!loading && !error && banners.length > 1 && (
                <>
                  <button
                    type="button"
                    className="btn btn-light rounded-circle shadow position-absolute top-50 start-0 translate-middle-y ms-2"
                    onClick={showPreviousBanner}
                    aria-label="Previous banner"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-light rounded-circle shadow position-absolute top-50 end-0 translate-middle-y me-2"
                    onClick={showNextBanner}
                    aria-label="Next banner"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </>
              )}

              {/* Banner Indicators */}
              {!loading && !error && banners.length > 1 && (
                <div className="d-flex justify-content-center gap-2 mt-3">
                  {banners.map((banner, index) => (
                    <button
                      key={banner._id}
                      type="button"
                      className={`btn rounded-pill p-0 ${
                        index === activeIndex ? "bg-primary" : "bg-secondary"
                      }`}
                      style={{
                        width: index === activeIndex ? "28px" : "10px",
                        height: "10px",
                        transition: "width 0.3s ease",
                      }}
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Show banner ${index + 1}`}
                      aria-current={index === activeIndex ? "true" : undefined}
                    />
                  ))}
                </div>
              )}

              {/* Floating Shopping Card */}
              <div
                className="position-absolute bottom-0 start-0 bg-white rounded-3 shadow p-3 m-4"
                style={{ maxWidth: "230px" }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary-subtle text-primary rounded-3 p-3">
                    <FontAwesomeIcon icon={faBagShopping} size="lg" />
                  </div>

                  <div>
                    <p className="fw-bold mb-1">Shop Smarter</p>
                    <small className="text-muted">
                      Find your next favourite
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
