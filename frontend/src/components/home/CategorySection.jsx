import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMobileScreenButton,
  faShirt,
  faHouse,
  faHeartPulse,
  faDumbbell,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL from "../../config/api";

const categoryIcons = {
  electronics: faMobileScreenButton,
  fashion: faShirt,
  "home & kitchen": faHouse,
  "beauty & personal care": faHeartPulse,
  "sports & fitness": faDumbbell,
};

function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
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
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return (
      <section className="py-5">
        <div className="container text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-3 mb-0">Loading categories...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="text-center mb-4">
          <h2 className="fw-bold">Shop by Category</h2>
          <p className="text-muted mb-0">
            Explore our popular product categories
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="text-muted text-center">
            No categories available right now.
          </p>
        ) : (
          <div className="row g-3 g-md-4">
            {categories.map((category) => {
              const icon =
                categoryIcons[category.name.toLowerCase()] || faLayerGroup;

              return (
                <div className="col-6 col-md-4 col-lg" key={category._id}>
                  <button
                    type="button"
                    className="card border-0 shadow-sm h-100 text-center p-3 p-md-4 w-100 rounded-4 bg-white"
                    onClick={() => handleCategoryClick(category.name)}
                    onMouseEnter={(event) => {
                      event.currentTarget.classList.add("shadow");
                      event.currentTarget.style.transform = "translateY(-5px)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.classList.remove("shadow");
                      event.currentTarget.style.transform = "translateY(0)";
                    }}
                    style={{
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    aria-label={`Shop ${category.name}`}
                  >
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="rounded-4 mb-3 mx-auto"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-4 mx-auto mb-3"
                        style={{
                          width: "80px",
                          height: "80px",
                        }}
                      >
                        <FontAwesomeIcon icon={icon} className="fs-2" />
                      </div>
                    )}

                    <h6 className="fw-semibold text-dark mb-0">
                      {category.name}
                    </h6>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default CategorySection;
