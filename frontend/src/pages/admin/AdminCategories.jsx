import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSearch,
  faEye,
  faPen,
  faTrash,
  faChevronLeft,
  faChevronRight,
  faFolder,
  faRotateRight,
  faTimes,
  faSave,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import BACKEND_URL from "../../config/api";
import { toast } from "react-toastify";
import AdminLayout from "../../components/admin/AdminLayout";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  isActive: true,
};

function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { authorization: token } : {};
  };

  // Fetch categories
  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${BACKEND_URL}/category/admin/all`, {
          headers: getHeaders(),
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Categories fetch nahi ho payi.");
        }

        setCategories(
          Array.isArray(result.categories) ? result.categories : [],
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

    fetchCategories();

    return () => controller.abort();
  }, [refreshKey]);

  // Search and pagination
  const filteredCategories = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return categories;

    return categories.filter((category) =>
      [category.name, category.slug, category.description].some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(value),
      ),
    );
  }, [categories, search]);

  const totalCategories = filteredCategories.length;
  const totalPages = Math.ceil(totalCategories / limit);
  const currentPage = Math.min(page, Math.max(totalPages, 1));

  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  const startNumber = totalCategories === 0 ? 0 : (currentPage - 1) * limit + 1;

  const endNumber = Math.min(currentPage * limit, totalCategories);

  const activeCount = categories.filter((category) => category.isActive).length;

  const inactiveCount = categories.length - activeCount;

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  // Modal handlers
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setForm({ ...emptyForm });
    setSelectedImage(null);
    setImagePreview("");
    setModalMode("add");
    setFormError("");
    setShowModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      image: category.image || "",
      isActive: Boolean(category.isActive),
    });
    setSelectedImage(null);
    setImagePreview(category.image || "");

    setModalMode("edit");
    setFormError("");
    setShowModal(true);
  };

  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setModalMode("view");
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedCategory(null);
    setForm({ ...emptyForm });
    setSelectedImage(null);
    setImagePreview("");
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedImage(file);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(selectedCategory?.image || "");
    }
  };

  // Create or update category
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.slug.trim()) {
      setFormError("Category name aur slug required hain.");
      return;
    }

    const isEditing = modalMode === "edit";

    if (!isEditing && !selectedImage) {
      setFormError("Please select a category image.");
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("slug", form.slug.trim().toLowerCase());
    payload.append("description", form.description.trim());
    payload.append("isActive", String(form.isActive));

    if (selectedImage) {
      payload.append("image", selectedImage);
    }

    const url = isEditing
      ? `${BACKEND_URL}/category/${selectedCategory._id}`
      : `${BACKEND_URL}/category`;

    try {
      setSaving(true);

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: getHeaders(),
        body: payload,
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Category save nahi ho payi.");
      }

      setShowModal(false);
      setSelectedCategory(null);
      setForm({ ...emptyForm });
      setSelectedImage(null);
      setImagePreview("");
      setSearch("");
      setPage(1);
      setRefreshKey((previous) => previous + 1);

      toast.success(
        result.message ||
          (isEditing
            ? "Category updated successfully."
            : "Category created successfully."),
      );
    } catch (err) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(
      `Kya tum "${category.name}" category delete karna chahte ho?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${BACKEND_URL}/category/${category._id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Category delete nahi ho payi.");
      }

      toast.success(result.message || "Category deleted successfully.");

      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      toast.error(err.message || "Category delete nahi ho payi.");
    }
  };

  const getStatus = (category) => {
    if (!category.isActive) {
      return {
        label: "Inactive",
        className: "bg-secondary-subtle text-secondary",
      };
    }

    return {
      label: "Active",
      className: "bg-success-subtle text-success",
    };
  };

  const getProductCount = (category) => {
    if (typeof category.productCount === "number") {
      return category.productCount;
    }

    if (typeof category.productsCount === "number") {
      return category.productsCount;
    }

    if (Array.isArray(category.products)) {
      return category.products.length;
    }

    return null;
  };

  return (
    <AdminLayout>
      {" "}
      <div className="container-fluid px-2 px-sm-3 px-lg-4 pt-3 pt-md-4 pb-3">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Categories</h2>
            <p className="text-muted mb-0">Manage your product categories</p>
          </div>

          <button
            className="btn btn-primary align-self-start align-self-sm-auto"
            onClick={handleAddCategory}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Category
          </button>
        </div>

        {/* Statistics */}
        <div className="row g-3 mb-4">
          {[
            {
              label: "Total Categories",
              value: categories.length,
              color: "",
            },
            {
              label: "Active",
              value: activeCount,
              color: "text-success",
            },
            {
              label: "Inactive",
              value: inactiveCount,
              color: "text-secondary",
            },
          ].map((item) => (
            <div className="col-6 col-xl-4" key={item.label}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <small className="text-muted">{item.label}</small>
                  <h4 className={`fw-bold mb-0 ${item.color}`}>{item.value}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <FontAwesomeIcon icon={faSearch} />
              </span>

              <input
                type="search"
                className="form-control"
                placeholder="Search by category name, slug or description..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />

              <button
                className="btn btn-outline-secondary"
                onClick={() => handleSearch("")}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2">
            <span>{error}</span>

            <button
              className="btn btn-sm btn-outline-danger flex-shrink-0"
              onClick={() => setRefreshKey((previous) => previous + 1)}
            >
              <FontAwesomeIcon icon={faRotateRight} className="me-2" />
              Retry
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div className="card border-0 shadow-sm d-none d-md-block">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-3 py-3">Category</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="text-end px-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <div className="spinner-border spinner-border-sm me-2" />
                      Loading categories...
                    </td>
                  </tr>
                ) : paginatedCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <FontAwesomeIcon
                        icon={faFolder}
                        size="2x"
                        className="text-muted mb-2"
                      />
                      <p className="mb-0">
                        {search
                          ? "No matching categories found."
                          : "No categories found."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((category) => {
                    const status = getStatus(category);
                    const productCount = getProductCount(category);

                    return (
                      <tr key={category._id}>
                        <td className="px-3">
                          <div className="d-flex align-items-center gap-3">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="rounded-3"
                                style={{
                                  width: 52,
                                  height: 52,
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: 52, height: 52 }}
                              >
                                <FontAwesomeIcon icon={faFolder} />
                              </div>
                            )}

                            <div>
                              <div className="fw-semibold">{category.name}</div>
                              <small className="text-muted">
                                {category.slug}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className="text-muted small"
                            style={{
                              display: "block",
                              maxWidth: 260,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {category.description || "—"}
                          </span>
                        </td>

                        <td>
                          <span className="badge bg-light text-dark border">
                            {productCount === null
                              ? "—"
                              : `${productCount} Products`}
                          </span>
                        </td>

                        <td>
                          <span className={`badge ${status.className}`}>
                            {status.label}
                          </span>
                        </td>

                        <td className="text-end px-3">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            title="View category"
                            onClick={() => handleViewCategory(category)}
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>

                          <button
                            className="btn btn-sm btn-outline-success me-2"
                            title="Edit category"
                            onClick={() => handleEditCategory(category)}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete category"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            loading={loading}
            start={startNumber}
            end={endNumber}
            total={totalCategories}
            onPageChange={setPage}
            itemName="categories"
          />
        </div>

        {/* Mobile cards */}
        <div className="d-md-none">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm me-2" />
              Loading categories...
            </div>
          ) : paginatedCategories.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <FontAwesomeIcon
                  icon={faFolder}
                  size="2x"
                  className="text-muted mb-2"
                />
                <p className="mb-0">
                  {search
                    ? "No matching categories found."
                    : "No categories found."}
                </p>
              </div>
            </div>
          ) : (
            paginatedCategories.map((category) => {
              const status = getStatus(category);
              const productCount = getProductCount(category);

              return (
                <div
                  className="card border-0 shadow-sm mb-3"
                  key={category._id}
                >
                  <div className="card-body p-3">
                    <div className="d-flex align-items-start gap-3">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="rounded-3 flex-shrink-0"
                          style={{
                            width: 65,
                            height: 65,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 65, height: 65 }}
                        >
                          <FontAwesomeIcon icon={faFolder} size="lg" />
                        </div>
                      )}

                      <div className="flex-grow-1 min-width-0">
                        <h6 className="fw-semibold mb-1">{category.name}</h6>

                        <small className="text-muted d-block text-break">
                          {category.slug}
                        </small>

                        <span className={`badge mt-2 ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <p className="text-muted small mt-3 mb-3 text-break">
                      {category.description || "No description available."}
                    </p>

                    <div className="row g-2">
                      <div className="col-12">
                        <div className="bg-light rounded p-2">
                          <small className="text-muted d-block">Products</small>
                          <span className="small fw-semibold">
                            {productCount === null
                              ? "Not available"
                              : productCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap justify-content-end gap-2 mt-3 pt-3 border-top">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewCategory(category)}
                      >
                        <FontAwesomeIcon icon={faEye} className="me-1" />
                        View
                      </button>

                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleEditCategory(category)}
                      >
                        <FontAwesomeIcon icon={faPen} className="me-1" />
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                loading={loading}
                start={startNumber}
                end={endNumber}
                total={totalCategories}
                onPageChange={setPage}
                itemName="categories"
              />
            </div>
          </div>
        </div>

        {/* Add / Edit / View modal */}
        {showModal && (
          <div
            className="category-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div className="category-modal-dialog">
              <div className="category-modal-content">
                <div className="d-flex justify-content-between align-items-center border-bottom p-3 p-md-4">
                  <div>
                    <h5 className="fw-bold mb-1">
                      {modalMode === "add"
                        ? "Add New Category"
                        : modalMode === "edit"
                          ? "Edit Category"
                          : "Category Details"}
                    </h5>

                    <small className="text-muted">
                      {modalMode === "view"
                        ? "Category information"
                        : "Fill in the category information"}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="category-modal-body p-3 p-md-4">
                  {formError && (
                    <div className="alert alert-danger">{formError}</div>
                  )}

                  {modalMode === "view" && selectedCategory ? (
                    <div>
                      <div className="text-center mb-4">
                        {selectedCategory.image ? (
                          <img
                            src={selectedCategory.image}
                            alt={selectedCategory.name}
                            className="img-fluid rounded-3 border"
                            style={{
                              maxWidth: "100%",
                              width: 180,
                              height: 150,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center mx-auto"
                            style={{ width: 120, height: 120 }}
                          >
                            <FontAwesomeIcon icon={faFolder} size="3x" />
                          </div>
                        )}
                      </div>

                      <h5 className="fw-bold">{selectedCategory.name}</h5>

                      <p className="text-muted">
                        {selectedCategory.description || "No description"}
                      </p>

                      <div className="row g-3">
                        {[
                          ["Category ID", selectedCategory._id],
                          ["Slug", selectedCategory.slug],
                          [
                            "Status",
                            selectedCategory.isActive ? "Active" : "Inactive",
                          ],
                          [
                            "Created",
                            selectedCategory.createdAt
                              ? new Date(
                                  selectedCategory.createdAt,
                                ).toLocaleDateString("en-IN")
                              : "—",
                          ],
                        ].map(([label, value]) => (
                          <div className="col-12 col-sm-6" key={label}>
                            <div className="bg-light rounded p-3 h-100">
                              <small className="text-muted d-block">
                                {label}
                              </small>
                              <span className="fw-semibold text-break">
                                {value || "—"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label">
                            Category Name <span className="text-danger">*</span>
                          </label>

                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={form.name}
                            onChange={handleChange}
                            required
                            disabled={saving}
                            placeholder="Enter category name"
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label">
                            Slug <span className="text-danger">*</span>
                          </label>

                          <input
                            type="text"
                            name="slug"
                            className="form-control"
                            value={form.slug}
                            onChange={handleChange}
                            required
                            disabled={saving}
                            placeholder="e.g. home-kitchen"
                          />

                          <small className="text-muted">
                            Unique URL-friendly category identifier.
                          </small>
                        </div>

                        <div className="col-12">
                          <label className="form-label">Description</label>

                          <textarea
                            name="description"
                            className="form-control"
                            rows="3"
                            value={form.description}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Describe this category"
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label">
                            Category Image{" "}
                            {modalMode === "add" && (
                              <span className="text-danger">*</span>
                            )}
                          </label>

                          <input
                            type="file"
                            name="image"
                            className="form-control"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={saving}
                            required={modalMode === "add"}
                          />
                          <small className="text-muted">
                            {modalMode === "edit"
                              ? "Choose a new image only if you want to replace the current one."
                              : "Select an image for this category."}
                          </small>

                          {imagePreview && (
                            <div className="mt-3">
                              <img
                                src={imagePreview}
                                alt="Category preview"
                                className="rounded-3 border"
                                style={{
                                  width: 110,
                                  height: 110,
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              name="isActive"
                              id="categoryActive"
                              className="form-check-input"
                              checked={form.isActive}
                              onChange={handleChange}
                              disabled={saving}
                            />

                            <label
                              className="form-check-label"
                              htmlFor="categoryActive"
                            >
                              Active Category
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={closeModal}
                          disabled={saving}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faSave} className="me-2" />
                              {modalMode === "add"
                                ? "Add Category"
                                : "Update Category"}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {modalMode === "view" && (
                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={closeModal}
                      >
                        Close
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={() => handleEditCategory(selectedCategory)}
                      >
                        <FontAwesomeIcon icon={faPen} className="me-2" />
                        Edit Category
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal styles */}
        <style>{`
        .category-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1060;
          background: rgba(15, 23, 42, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .category-modal-dialog {
          width: 100%;
          max-width: 650px;
          max-height: 100%;
          margin: auto;
        }

        .category-modal-content {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .category-modal-body {
          max-height: calc(100vh - 150px);
          overflow-y: auto;
        }

        @media (max-width: 576px) {
          .category-modal-overlay {
            padding: 8px;
          }

          .category-modal-body {
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
  itemName,
}) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 py-3 px-3">
      <small className="text-muted">
        Showing {start}–{end} of {total} {itemName}
      </small>

      <div className="d-flex align-items-center gap-2">
        <button
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

export default AdminCategories;
