import React, { useEffect, useState } from "react";
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
  faBoxOpen,
  faRotateRight,
  faTimes,
  faImage,
  faSave,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL from "../../config/api";

import { toast } from "react-toastify";
import AdminLayout from "../../components/admin/AdminLayout";

const emptyForm = {
  name: "",

  description: "",

  price: "",

  discountPrice: "",

  costPrice: "",

  category: "",

  stock: 0,

  brand: "",

  sku: "",

  isActive: true,

  images: [],
};

function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const limit = 10;

  const [totalProducts, setTotalProducts] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [stats, setStats] = useState({
    total: 0,

    active: 0,

    inactive: 0,

    lowStock: 0,

    outOfStock: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states

  const [showModal, setShowModal] = useState(false);

  const [modalMode, setModalMode] = useState("add");

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState("");

  const [message, setMessage] = useState("");

  const [imagePreviews, setImagePreviews] = useState([]);

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return token ? { authorization: token } : {};
  };

  // Fetch products

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);

        setError("");

        const params = new URLSearchParams({
          search,

          page: String(page),

          limit: String(limit),
        });

        const response = await fetch(
          `${BACKEND_URL}/products/admin/all?${params}`,

          {
            headers: getHeaders(),

            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Products fetch nahi ho paye.");
        }

        setProducts(result.products || []);

        setTotalProducts(result.totalProducts || 0);

        setTotalPages(result.totalPages || 0);

        setStats(
          result.stats || {
            total: 0,

            active: 0,

            inactive: 0,

            lowStock: 0,

            outOfStock: 0,
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

    fetchProducts();

    return () => controller.abort();
  }, [search, page, refreshKey]);

  // Fetch categories for admin product form

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/category/admin/all`, {
          method: "GET",

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
          toast.error("Category fetch error:", err.message);
        }
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, []);

  // Search

  const handleSearch = (value) => {
    setSearch(value);

    setPage(1);
  };

  // Status

  const getStatus = (product) => {
    if (Number(product.stock) === 0) {
      return {
        label: "Out of Stock",

        className: "bg-danger-subtle text-danger",
      };
    }

    if (!product.isActive) {
      return {
        label: "Inactive",

        className: "bg-secondary-subtle text-secondary",
      };
    }

    if (Number(product.stock) <= 5) {
      return {
        label: "Low Stock",

        className: "bg-warning-subtle text-warning-emphasis",
      };
    }

    return {
      label: "Active",

      className: "bg-success-subtle text-success",
    };
  };

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("en-IN", {
      style: "currency",

      currency: "INR",

      maximumFractionDigits: 2,
    });

  const getCategoryName = (category) => {
    if (!category) return "Uncategorized";

    if (typeof category === "object") {
      return category.name || "Uncategorized";
    }

    const found = categories.find((item) => item._id === category);

    return found?.name || "Uncategorized";
  };

  const getProductImage = (product) => {
    return product.images?.[0] || "";
  };

  // Open Add modal

  const handleAddProduct = () => {
    setSelectedProduct(null);

    setForm({ ...emptyForm });

    setModalMode("add");

    setFormError("");

    setImagePreviews([]);

    setShowModal(true);
  };

  // Open Edit modal

  const handleEditProduct = (product) => {
    setSelectedProduct(product);

    setForm({
      name: product.name || "",

      description: product.description || "",

      price: product.price ?? "",

      discountPrice: product.discountPrice ?? "",

      costPrice: product.costPrice ?? "",

      category:
        typeof product.category === "object"
          ? product.category?._id || ""
          : product.category || "",

      stock: product.stock ?? 0,

      brand: product.brand || "",

      sku: product.sku || "",

      isActive: Boolean(product.isActive),

      images: [],
    });

    setImagePreviews(product.images || []);

    setModalMode("edit");

    setFormError("");

    setShowModal(true);
  };

  // Open View modal

  const handleViewProduct = (product) => {
    setSelectedProduct(product);

    setModalMode("view");

    setFormError("");

    setImagePreviews(product.images || []);

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);

    setSelectedProduct(null);

    setForm({ ...emptyForm });

    setImagePreviews([]);

    setFormError("");
  };

  // Handle input changes

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => {
      const updatedForm = {
        ...previous,

        [name]: type === "checkbox" ? checked : value,
      };

      return updatedForm;
    });
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const input = e.target;
    const files = Array.from(input.files || []);

    // File picker reset
    input.value = "";

    if (files.length === 0) return;

    if (files.some((file) => !file.type.startsWith("image/"))) {
      setFormError("Sirf image files select karo.");
      return;
    }

    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setFormError("Har image ka size 5 MB se kam hona chahiye.");
      return;
    }

    const existingImages =
      modalMode === "edit" ? selectedProduct?.images || [] : [];

    // Existing images + newly selected images
    if (existingImages.length + form.images.length + files.length > 5) {
      setFormError("Maximum 5 images allowed hain.");
      return;
    }

    setFormError("");

    setForm((previous) => ({
      ...previous,
      images: [...previous.images, ...files],
    }));

    setImagePreviews((previous) => [
      ...previous,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
  };

  // Save product

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.category ||
      !form.sku.trim() ||
      form.price === "" ||
      form.costPrice === ""
    ) {
      setFormError("Required fields fill karo.");

      return;
    }

    if (
      Number(form.price) < 0 ||
      Number(form.costPrice) < 0 ||
      Number(form.stock) < 0
    ) {
      setFormError("Price, cost price aur stock negative nahi ho sakte.");

      return;
    }

    if (
      form.discountPrice !== "" &&
      Number(form.discountPrice) > Number(form.price)
    ) {
      setFormError("Discount price original price se zyada nahi ho sakti.");

      return;
    }

    if (!Number.isInteger(Number(form.stock))) {
      setFormError("Stock quantity whole number honi chahiye.");

      return;
    }

    if (modalMode === "add" && form.images.length === 0) {
      setFormError("Kam se kam ek product image select karo.");

      return;
    }

    const formData = new FormData();

    formData.append("name", form.name.trim());

    formData.append("description", form.description.trim());

    formData.append("price", form.price);

    formData.append("costPrice", form.costPrice);

    formData.append("category", form.category);

    formData.append("stock", String(form.stock));

    formData.append("brand", form.brand.trim());

    formData.append("sku", form.sku.trim());

    formData.append("isActive", String(form.isActive));

    if (form.discountPrice !== "") {
      formData.append("discountPrice", form.discountPrice);
    }

    form.images.forEach((file) => {
      formData.append("images", file);
    });

    const isEditing = modalMode === "edit";

    const url = isEditing
      ? `${BACKEND_URL}/products/${selectedProduct._id}`
      : `${BACKEND_URL}/products`;

    try {
      setSaving(true);

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: getHeaders(),

        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Product save nahi ho paya.");
      }

      setShowModal(false);

      setSelectedProduct(null);

      setForm({ ...emptyForm });

      setImagePreviews([]);

      setSearch("");

      setPage(1);

      setRefreshKey((previous) => previous + 1);

      setMessage(
        result.message ||
          (isEditing
            ? "Product updated successfully."
            : "Product created successfully."),
      );

      window.setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Delete product

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Kya tum "${product.name}" ko delete karna chahte ho?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${BACKEND_URL}/products/${product._id}`, {
        method: "DELETE",

        headers: getHeaders(),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Product delete nahi hua.");
      }

      setMessage(result.message || "Product deleted successfully.");

      setRefreshKey((previous) => previous + 1);

      window.setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      setError(err.message || "Product delete nahi hua.");
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    const existingImages = selectedProduct?.images || [];

    const isExistingImage = existingImages.includes(imageUrl);

    // New image hai jo abhi upload nahi hui

    if (!isExistingImage) {
      const previewIndex = imagePreviews.indexOf(imageUrl);

      const newImageIndex = previewIndex - existingImages.length;

      if (newImageIndex < 0) return;

      setForm((previous) => ({
        ...previous,

        images: previous.images.filter((_, index) => index !== newImageIndex),
      }));

      setImagePreviews((previous) =>
        previous.filter((image) => image !== imageUrl),
      );

      URL.revokeObjectURL(imageUrl);

      return;
    }

    const confirmed = window.confirm(
      "Kya tum is product image ko permanently delete karna chahte ho?",
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response = await fetch(
        `${BACKEND_URL}/products/${selectedProduct._id}/images`,

        {
          method: "DELETE",

          headers: {
            ...getHeaders(),

            "Content-Type": "application/json",
          },

          body: JSON.stringify({ imageUrl }),
        },
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Image delete nahi hui.");
      }

      const updatedImages = selectedProduct.images.filter(
        (image) => image !== imageUrl,
      );

      setSelectedProduct((previous) => ({
        ...previous,

        images: updatedImages,
      }));

      setProducts((previous) =>
        previous.map((product) =>
          product._id === selectedProduct._id
            ? { ...product, images: updatedImages }
            : product,
        ),
      );

      setImagePreviews((previous) =>
        previous.filter((image) => image !== imageUrl),
      );

      toast.success("Product image deleted successfully.");
    } catch (err) {
      toast.error(err.message || "Image delete nahi hui.");
    } finally {
      setSaving(false);
    }
  };

  const startProductNumber = totalProducts === 0 ? 0 : (page - 1) * limit + 1;

  const endProductNumber = Math.min(page * limit, totalProducts);

  return (
    <AdminLayout>
      <div className="container-fluid px-2 px-sm-3 px-lg-4 pt-3 pt-md-4">
        {/* Header */}

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Products</h2>

            <p className="text-muted mb-0">Manage your store products</p>
          </div>

          <div className="d-flex justify-content-start">
            <button className="btn btn-primary" onClick={handleAddProduct}>
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Success message */}

        {message && (
          <div className="alert alert-success alert-dismissible">
            {message}

            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage("")}
            />
          </div>
        )}

        {/* Statistics */}

        <div className="row g-3 mb-4">
          {[
            { label: "Total Products", value: stats.total, color: "" },

            { label: "Active", value: stats.active, color: "text-success" },

            {
              label: "Inactive",
              value: stats.inactive,
              color: "text-secondary",
            },

            {
              label: "Low Stock",
              value: stats.lowStock,
              color: "text-warning",
            },

            {
              label: "Out of Stock",

              value: stats.outOfStock,

              color: "text-danger",
            },
          ].map((item) => (
            <div className="col-6 col-xl" key={item.label}>
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
                placeholder="Search by product name, SKU or brand..."
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

        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span>{error}</span>

            <button
              className="btn btn-sm btn-outline-danger"
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
                  <th className="px-3 py-3">Product</th>

                  <th>Category</th>

                  <th>Price</th>

                  <th>Stock</th>

                  <th>Status</th>

                  <th className="text-end px-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="spinner-border spinner-border-sm me-2" />
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <FontAwesomeIcon
                        icon={faBoxOpen}
                        size="2x"
                        className="text-muted mb-2"
                      />

                      <p className="mb-0">No products found.</p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const status = getStatus(product);

                    return (
                      <tr key={product._id}>
                        <td className="px-3">
                          <div className="d-flex align-items-center gap-3">
                            {getProductImage(product) ? (
                              <img
                                src={getProductImage(product)}
                                alt={product.name}
                                className="rounded-3"
                                style={{
                                  width: 52,

                                  height: 52,

                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="bg-light rounded-3 d-flex align-items-center justify-content-center"
                                style={{ width: 52, height: 52 }}
                              >
                                <FontAwesomeIcon icon={faBoxOpen} />
                              </div>
                            )}

                            <div>
                              <div className="fw-semibold">{product.name}</div>

                              <small className="text-muted">
                                {product.sku}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>{getCategoryName(product.category)}</td>

                        <td>
                          <div className="fw-semibold">
                            {formatPrice(
                              product.discountPrice ?? product.price,
                            )}
                          </div>

                          {product.discountPrice != null && (
                            <small className="text-muted text-decoration-line-through">
                              {formatPrice(product.price)}
                            </small>
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              product.stock === 0
                                ? "text-danger fw-semibold"
                                : product.stock <= 5
                                  ? "text-warning-emphasis fw-semibold"
                                  : ""
                            }
                          >
                            {product.stock}
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
                            title="View product"
                            onClick={() => handleViewProduct(product)}
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>

                          <button
                            className="btn btn-sm btn-outline-success me-2"
                            title="Edit product"
                            onClick={() => handleEditProduct(product)}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete product"
                            onClick={() => handleDeleteProduct(product)}
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
            page={page}
            totalPages={totalPages}
            loading={loading}
            start={startProductNumber}
            end={endProductNumber}
            total={totalProducts}
            onPageChange={setPage}
          />
        </div>

        {/* Mobile cards */}

        <div className="d-md-none">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm me-2" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <FontAwesomeIcon
                  icon={faBoxOpen}
                  size="2x"
                  className="text-muted mb-2"
                />

                <p className="mb-0">No products found.</p>
              </div>
            </div>
          ) : (
            products.map((product) => {
              const status = getStatus(product);

              return (
                <div className="card border-0 shadow-sm mb-3" key={product._id}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-start gap-3">
                      {getProductImage(product) ? (
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="rounded-3"
                          style={{
                            width: 65,

                            height: 65,

                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="bg-light rounded-3 d-flex align-items-center justify-content-center"
                          style={{ width: 65, height: 65 }}
                        >
                          <FontAwesomeIcon icon={faBoxOpen} />
                        </div>
                      )}

                      <div className="flex-grow-1">
                        <h6 className="fw-semibold mb-1">{product.name}</h6>

                        <small className="text-muted d-block">
                          {product.sku}
                        </small>

                        <span className={`badge mt-2 ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="row g-2 mt-2">
                      <div className="col-6">
                        <div className="bg-light rounded p-2">
                          <small className="text-muted d-block">Category</small>

                          <span className="small fw-semibold">
                            {getCategoryName(product.category)}
                          </span>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="bg-light rounded p-2">
                          <small className="text-muted d-block">Price</small>

                          <span className="small fw-semibold">
                            {formatPrice(
                              product.discountPrice ?? product.price,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="bg-light rounded p-2">
                          <small className="text-muted d-block">Stock</small>

                          <span className="small fw-semibold">
                            {product.stock}
                          </span>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="bg-light rounded p-2">
                          <small className="text-muted d-block">Brand</small>

                          <span className="small fw-semibold">
                            {product.brand || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewProduct(product)}
                      >
                        <FontAwesomeIcon icon={faEye} className="me-1" />
                        View
                      </button>

                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleEditProduct(product)}
                      >
                        <FontAwesomeIcon icon={faPen} className="me-1" />
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteProduct(product)}
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
                page={page}
                totalPages={totalPages}
                loading={loading}
                start={startProductNumber}
                end={endProductNumber}
                total={totalProducts}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>

        {/* Add / Edit / View Modal */}

        {showModal && (
          <div
            className="product-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div className="product-modal-dialog">
              <div className="product-modal-content">
                <div className="d-flex justify-content-between align-items-center border-bottom p-3 p-md-4">
                  <div>
                    <h5 className="fw-bold mb-1">
                      {modalMode === "add"
                        ? "Add New Product"
                        : modalMode === "edit"
                          ? "Edit Product"
                          : "Product Details"}
                    </h5>

                    <small className="text-muted">
                      {modalMode === "view"
                        ? "Product information"
                        : "Fill in the product information"}
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

                <div className="product-modal-body p-3 p-md-4">
                  {formError && (
                    <div className="alert alert-danger">{formError}</div>
                  )}

                  {modalMode === "view" && selectedProduct ? (
                    <div>
                      <div className="row g-3 mb-4">
                        {(selectedProduct.images || []).length > 0 ? (
                          selectedProduct.images.map((image, index) => (
                            <div className="col-4" key={`${image}-${index}`}>
                              <img
                                src={image}
                                alt={`${selectedProduct.name} ${index + 1}`}
                                className="img-fluid rounded border"
                                style={{
                                  width: "100%",

                                  height: 130,

                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="col-12 text-muted">
                            No product images available.
                          </div>
                        )}
                      </div>

                      <h5 className="fw-bold">{selectedProduct.name}</h5>

                      <p className="text-muted">
                        {selectedProduct.description || "No description"}
                      </p>

                      <div className="row g-3">
                        {[
                          ["Brand", selectedProduct.brand || "—"],

                          ["SKU", selectedProduct.sku || "—"],

                          [
                            "Category",
                            getCategoryName(selectedProduct.category),
                          ],

                          ["Price", formatPrice(selectedProduct.price)],

                          [
                            "Cost Price",
                            selectedProduct.costPrice != null
                              ? formatPrice(selectedProduct.costPrice)
                              : "—",
                          ],

                          [
                            "Discount Price",

                            selectedProduct.discountPrice != null
                              ? formatPrice(selectedProduct.discountPrice)
                              : "—",
                          ],

                          ["Stock", selectedProduct.stock],

                          [
                            "Status",

                            selectedProduct.isActive ? "Active" : "Inactive",
                          ],
                        ].map(([label, value]) => (
                          <div className="col-6" key={label}>
                            <div className="bg-light rounded p-3 h-100">
                              <small className="text-muted d-block">
                                {label}
                              </small>

                              <span className="fw-semibold">{value}</span>
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
                            Product Name <span className="text-danger">*</span>
                          </label>

                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={form.name}
                            onChange={handleChange}
                            required
                            disabled={saving}
                            placeholder="Enter product name"
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label">
                            Description <span className="text-danger">*</span>
                          </label>

                          <textarea
                            name="description"
                            className="form-control"
                            rows="3"
                            value={form.description}
                            onChange={handleChange}
                            required
                            disabled={saving}
                            placeholder="Describe the product"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Brand</label>

                          <input
                            type="text"
                            name="brand"
                            className="form-control"
                            value={form.brand}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Brand name"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            SKU <span className="text-danger">*</span>
                          </label>

                          <input
                            type="text"
                            name="sku"
                            className="form-control"
                            value={form.sku}
                            onChange={handleChange}
                            required
                            disabled={saving}
                            placeholder="Unique product SKU"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Price (₹) <span className="text-danger">*</span>
                          </label>

                          <input
                            type="number"
                            name="price"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={handleChange}
                            required
                            disabled={saving}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Cost Price (₹){" "}
                            <span className="text-danger">*</span>
                          </label>

                          <input
                            type="number"
                            name="costPrice"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={form.costPrice}
                            onChange={handleChange}
                            required
                            disabled={saving}
                            placeholder="Enter purchase cost"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Discount Price (₹)
                          </label>

                          <input
                            type="number"
                            name="discountPrice"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={form.discountPrice}
                            onChange={handleChange}
                            disabled={saving}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Category <span className="text-danger">*</span>
                          </label>

                          <select
                            name="category"
                            className="form-select"
                            value={form.category}
                            onChange={handleChange}
                            required
                            disabled={saving}
                          >
                            <option value="">Select category</option>

                            {categories.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.name}
                              </option>
                            ))}
                          </select>

                          {categories.length === 0 && (
                            <small className="text-danger">
                              Categories load nahi hui. Category API check karo.
                            </small>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Stock Quantity{" "}
                            <span className="text-danger">*</span>
                          </label>

                          <input
                            type="number"
                            name="stock"
                            className="form-control"
                            min="0"
                            step="1"
                            value={form.stock}
                            onChange={handleChange}
                            required
                            disabled={saving}
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label">
                            <FontAwesomeIcon icon={faImage} className="me-2" />
                            Product Images (Maximum 5)
                          </label>

                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            disabled={saving}
                          />

                          {modalMode === "edit" && (
                            <small className="text-muted">
                              Existing images retain rahengi. New images add
                              hongi.
                            </small>
                          )}

                          {imagePreviews.length > 0 && (
                            <div className="row g-3 mt-2">
                              {imagePreviews.map((image, index) => (
                                <div
                                  className="col-6 col-sm-4 col-md-3"
                                  key={image}
                                >
                                  <div className="border rounded p-2 h-100">
                                    <img
                                      src={image}
                                      alt={`Product ${index + 1}`}
                                      className="img-fluid rounded"
                                      style={{
                                        width: "100%",

                                        height: 100,

                                        objectFit: "cover",
                                      }}
                                    />

                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger w-100 mt-2"
                                      onClick={() => handleDeleteImage(image)}
                                      disabled={saving}
                                    >
                                      <FontAwesomeIcon
                                        icon={faTrash}
                                        className="me-2"
                                      />
                                      Delete Image
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              name="isActive"
                              id="productActive"
                              className="form-check-input"
                              checked={form.isActive}
                              onChange={handleChange}
                              disabled={saving}
                            />

                            <label
                              className="form-check-label"
                              htmlFor="productActive"
                            >
                              Active Product
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
                                ? "Add Product"
                                : "Update Product"}
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
                        onClick={() => handleEditProduct(selectedProduct)}
                      >
                        <FontAwesomeIcon icon={faPen} className="me-2" />
                        Edit Product
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

        .product-modal-overlay {

          position: fixed;

          inset: 0;

          z-index: 1060;

          background: rgba(15, 23, 42, 0.65);

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 16px;

        }

        .product-modal-dialog {

          width: 100%;

          max-width: 760px;

          max-height: 100%;

          margin: auto;

        }

        .product-modal-content {

          background: #fff;

          border-radius: 16px;

          overflow: hidden;

          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

        }

        .product-modal-body {

          max-height: calc(100vh - 150px);

          overflow-y: auto;

        }

        @media (max-width: 576px) {

          .product-modal-overlay {

            padding: 8px;

          }

          .product-modal-body {

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
        Showing {start}–{end} of {total} products
      </small>

      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange((current) => current - 1)}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <span className="small">
          Page {totalPages === 0 ? 0 : page} of {totalPages}
        </span>

        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange((current) => current + 1)}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}

export default AdminProducts;
