import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faHouse,
  faRotateRight,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import ProductFilters from "../components/products/ProductFilters";
import ProductGrid from "../components/products/ProductGrid";
import BACKEND_URL from "../config/api";
import { toast } from "react-toastify";

const initialFilters = {
  category: "",
  minPrice: "",
  maxPrice: "",
  rating: "",
};

const PRODUCTS_PER_PAGE = 10;

function Products() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get("search") || "";
  const categoryFromURL = searchParams.get("category") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    category: categoryFromURL,
  }));

  // Sync category when navigating from CategorySection
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: categoryFromURL,
    }));

    setCurrentPage(1);
  }, [categoryFromURL]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch products whenever filters, sorting or page changes
  useEffect(() => {
    const controller = new AbortController();

    const getProducts = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }

        if (filters.category) {
          params.set("category", filters.category);
        }

        if (filters.minPrice !== "") {
          params.set("minPrice", filters.minPrice);
        }

        if (filters.maxPrice !== "") {
          params.set("maxPrice", filters.maxPrice);
        }

        if (filters.rating !== "") {
          params.set("minRating", filters.rating);
        }

        if (sortBy) {
          params.set("sort", sortBy);
        }

        params.set("page", String(currentPage));
        params.set("limit", String(PRODUCTS_PER_PAGE));

        const url = `${BACKEND_URL}/products?${params.toString()}`;

        const response = await fetch(url, {
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(0);
          toast.error(result.message || "Products fetch nahi ho paye.");
          return;
        }

        setProducts(Array.isArray(result.products) ? result.products : []);
        setTotalProducts(Number(result.totalProducts) || 0);
        setTotalPages(Number(result.totalPages) || 0);
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Error fetching products:", error);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
        toast.error("Something went wrong");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    getProducts();

    return () => controller.abort();
  }, [
    searchQuery,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.rating,
    sortBy,
    currentPage,
  ]);

  const handleApplyFilters = (newFilters) => {
    setCurrentPage(1);

    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Reset all filters, sorting, search and pagination
  const handleResetFilters = () => {
    setFilters({ ...initialFilters });
    setSortBy("");
    setCurrentPage(1);

    navigate("/products", { replace: true });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  };

  return (
    <>
      <style>{`
        /* Desktop dashboard layout */
        .products-dashboard-shell {
          height: 100vh;
          overflow: hidden;
        }

        .products-dashboard-layout {
          display: flex;
          flex-direction: row;
          height: 100%;
          min-height: 0;
          flex-wrap: nowrap;
        }

        .products-dashboard-sidebar {
          flex: 0 0 280px;
          width: 280px;
          max-width: 280px;
          height: 100%;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
        }

        .products-dashboard-content {
          flex: 1 1 0;
          width: 0;
          min-width: 0;
          height: 100%;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
        }

        .products-pagination .page-link {
          cursor: pointer;
        }

        .products-pagination .page-link:disabled {
          cursor: not-allowed;
        }

        /* Mobile layout */
        @media (max-width: 991.98px) {
          .products-dashboard-shell {
            height: auto;
            min-height: 100vh;
            overflow: visible;
          }

          .products-dashboard-layout {
            display: flex;
            flex-direction: column;
            flex-wrap: nowrap;
            height: auto;
            min-height: 100vh;
          }

          .products-dashboard-sidebar {
            flex: 0 0 auto;
            width: 100%;
            max-width: 100%;
            height: auto;
            min-height: 0;
            overflow: visible;
          }

          .products-dashboard-content {
            flex: 0 0 auto;
            width: 100%;
            max-width: 100%;
            height: auto;
            min-height: 0;
            overflow: visible;
          }
        }
      `}</style>

      <main className="bg-body-tertiary products-dashboard-shell">
        <div className="d-flex flex-column flex-lg-row products-dashboard-layout">
          {/* Filters Sidebar */}
          <aside className="col-12 col-lg-3 bg-white border-end p-3 p-md-4 products-dashboard-sidebar">
            <div className="mb-3">
              <h5 className="fw-bold mb-1">Filters</h5>
              <p className="text-muted small mb-0">Find your perfect product</p>
            </div>

            <ProductFilters
              onApplyFilters={handleApplyFilters}
              appliedFilters={filters}
            />

            <button
              type="button"
              className="btn btn-outline-secondary w-100 mt-3"
              onClick={handleResetFilters}
            >
              <FontAwesomeIcon icon={faRotateRight} className="me-2" />
              Reset All Filters
            </button>
          </aside>

          {/* Products Content */}
          <section className="flex-grow-1 w-100 col min-w-0 products-dashboard-content">
            <div className="container-fluid p-3 p-md-4">
              {/* Page Header */}
              <div className="mb-4">
                <h2 className="fw-bold mb-1">
                  {filters.category
                    ? filters.category
                    : searchQuery
                      ? "Search Results"
                      : "All Products"}
                </h2>

                <p className="text-muted mb-0">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : filters.category
                      ? `Explore products in ${filters.category}`
                      : "Explore our collection of products"}
                </p>
              </div>

              {/* Products Toolbar */}
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                <p className="text-muted mb-0">
                  Showing {products.length} of {totalProducts} products
                </p>

                <select
                  className="form-select w-auto"
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Sort products"
                >
                  <option value="">Sort By</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                    aria-label="Loading products"
                  />

                  <p className="text-muted mt-3 mb-0">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                /* Empty State */
                <div
                  className="bg-light rounded-4 text-center px-3 py-5 px-md-5"
                  style={{ minHeight: "350px" }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4"
                    style={{
                      width: "100px",
                      height: "100px",
                      backgroundColor: "#e7f0ff",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faBagShopping}
                      style={{
                        fontSize: "42px",
                        color: "#0d6efd",
                      }}
                    />
                  </div>

                  <h3 className="fw-bold mb-2">No matching products found</h3>

                  <p
                    className="text-muted mx-auto mb-4"
                    style={{ maxWidth: "420px" }}
                  >
                    Try changing your search or filters to find products.
                  </p>

                  <div className="d-flex justify-content-center flex-wrap gap-3">
                    <button
                      type="button"
                      className="btn btn-primary px-4 py-2"
                      onClick={() => navigate("/")}
                    >
                      <FontAwesomeIcon icon={faHouse} className="me-2" />
                      Go to Home
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-primary px-4 py-2"
                      onClick={handleRefresh}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faRotateRight} className="me-2" />
                      Refresh
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Product Cards */}
                  <ProductGrid products={products} />

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mt-4">
                      <p className="text-muted small mb-0">
                        Page {currentPage} of {totalPages}
                      </p>

                      <nav aria-label="Products pagination">
                        <ul className="pagination products-pagination mb-0 flex-wrap">
                          <li
                            className={`page-item ${
                              currentPage === 1 ? "disabled" : ""
                            }`}
                          >
                            <button
                              type="button"
                              className="page-link"
                              disabled={currentPage === 1 || loading}
                              onClick={() => handlePageChange(currentPage - 1)}
                              aria-label="Previous page"
                            >
                              <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                          </li>

                          {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1,
                          ).map((page) => (
                            <li
                              key={page}
                              className={`page-item ${
                                currentPage === page ? "active" : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="page-link"
                                aria-current={
                                  currentPage === page ? "page" : undefined
                                }
                                disabled={loading}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          ))}

                          <li
                            className={`page-item ${
                              currentPage === totalPages ? "disabled" : ""
                            }`}
                          >
                            <button
                              type="button"
                              className="page-link"
                              disabled={currentPage === totalPages || loading}
                              onClick={() => handlePageChange(currentPage + 1)}
                              aria-label="Next page"
                            >
                              <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default Products;
