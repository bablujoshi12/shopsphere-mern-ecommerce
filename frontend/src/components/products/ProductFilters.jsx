import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import BACKEND_URL from "../../config/api";

const initialFilters = {
  category: "",
  minPrice: "",
  maxPrice: "",
  rating: "",
};

function ProductFilters({ onApplyFilters, appliedFilters }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");

  const [filters, setFilters] = useState({
    ...initialFilters,
    ...appliedFilters,
  });

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoryError("");

        const response = await fetch(`${BACKEND_URL}/category`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Categories fetch nahi ho payi.");
        }

        const fetchedCategories = Array.isArray(result.categories)
          ? result.categories
          : [];

        setCategories(
          fetchedCategories.filter((category) => category.isActive === true),
        );
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategoryError("Categories load nahi ho payi.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Sync filters when appliedFilters changes
  useEffect(() => {
    setFilters({
      ...initialFilters,
      ...appliedFilters,
    });
  }, [appliedFilters]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCategoryChange = (category) => {
    setFilters((current) => ({
      ...current,
      category: current.category === category ? "" : category,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (filters.minPrice !== "" && Number(filters.minPrice) < 0) {
      return;
    }

    if (filters.maxPrice !== "" && Number(filters.maxPrice) < 0) {
      return;
    }

    if (
      filters.minPrice !== "" &&
      filters.maxPrice !== "" &&
      Number(filters.minPrice) > Number(filters.maxPrice)
    ) {
      return;
    }

    onApplyFilters({ ...filters });
  };

  return (
    <form className="card border-0 shadow-sm p-4" onSubmit={handleSubmit}>
      <div className="mb-3">
        <h5 className="fw-bold mb-0">
          <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
          Filters
        </h5>
      </div>

      <hr />

      {/* Dynamic Categories */}
      <h6 className="fw-bold mb-3">Categories</h6>

      {loadingCategories ? (
        <div className="text-muted small">
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          />
          Loading categories...
        </div>
      ) : categoryError ? (
        <p className="text-danger small mb-0">{categoryError}</p>
      ) : categories.length === 0 ? (
        <p className="text-muted small mb-0">No categories available.</p>
      ) : (
        categories.map((category) => (
          <div className="form-check mb-2" key={category._id}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`category-${category._id}`}
              checked={filters.category === category.name}
              onChange={() => handleCategoryChange(category.name)}
            />

            <label
              className="form-check-label"
              htmlFor={`category-${category._id}`}
            >
              {category.name}
            </label>
          </div>
        ))
      )}

      <hr className="my-4" />

      {/* Price Range */}
      <h6 className="fw-bold mb-3">Price Range</h6>

      <div className="d-flex gap-2">
        <input
          type="number"
          name="minPrice"
          className="form-control"
          placeholder="Min ₹"
          min="0"
          value={filters.minPrice}
          onChange={handleChange}
        />

        <input
          type="number"
          name="maxPrice"
          className="form-control"
          placeholder="Max ₹"
          min="0"
          value={filters.maxPrice}
          onChange={handleChange}
        />
      </div>

      {filters.minPrice !== "" &&
        filters.maxPrice !== "" &&
        Number(filters.minPrice) > Number(filters.maxPrice) && (
          <small className="text-danger mt-2">
            Maximum price must be greater than minimum price.
          </small>
        )}

      <hr className="my-4" />

      {/* Rating */}
      <h6 className="fw-bold mb-3">Rating</h6>

      {[4, 3, 2, 1].map((rating) => (
        <div className="form-check mb-2" key={rating}>
          <input
            className="form-check-input"
            type="radio"
            name="rating"
            id={`rating-${rating}`}
            value={String(rating)}
            checked={filters.rating === String(rating)}
            onChange={handleChange}
          />

          <label className="form-check-label" htmlFor={`rating-${rating}`}>
            {rating} <span className="text-warning">★</span>
            {" & above"}
          </label>
        </div>
      ))}

      <button
        type="submit"
        className="btn btn-primary w-100 mt-3"
        disabled={
          filters.minPrice !== "" &&
          filters.maxPrice !== "" &&
          Number(filters.minPrice) > Number(filters.maxPrice)
        }
      >
        Apply Filters
      </button>
    </form>
  );
}

export default ProductFilters;
