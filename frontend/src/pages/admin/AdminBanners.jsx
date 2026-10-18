import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSearch,
  faPen,
  faTrash,
  faImage,
  faEye,
  faPowerOff,
  faBullhorn,
  faCheck,
  faExclamationCircle,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import BACKEND_URL from "../../config/api";
import AdminLayout from "../../components/admin/AdminLayout";

const emptyForm = {
  title: "",
  description: "",
  imageFile: null,
  image: "",
  link: "/products",
  isActive: true,
  displayOrder: 0,
};
const modalStyles = `
  .banner-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1060;
    background: rgba(15, 23, 42, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    overflow-y: auto;
  }

  .banner-modal-dialog {
    width: 100%;
    max-width: 680px;
    margin: auto;
  }

  .banner-modal-content {
    background: #fff;
    border: 0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .banner-modal-body {
    max-height: calc(100vh - 210px);
    overflow-y: auto;
  }

  .banner-modal-header,
  .banner-modal-footer {
    background: #fff;
  }

  @media (max-width: 576px) {
    .banner-modal-overlay {
      padding: 10px;
    }

    .banner-modal-dialog {
      max-width: 100%;
    }

    .banner-modal-body {
      padding: 16px !important;
      max-height: calc(100vh - 190px);
    }

    .banner-modal-header,
    .banner-modal-footer {
      padding: 14px 16px !important;
    }
  }
`;

// API helpers component ke bahar hain
const getHeaders = (json = false) => {
  const token = localStorage.getItem("token");
  const headers = {};

  if (token) {
    headers.authorization = token;
  }

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, options);

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result;
};

function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const showMessage = (message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  };

  // Fetch all banners
  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await request(`${BACKEND_URL}/banners/admin/all`, {
        headers: getHeaders(),
      });

      setBanners(Array.isArray(result.banners) ? result.banners : []);

      return true;
    } catch (err) {
      setError(err.message || "Unable to load banners.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Local image preview
  useEffect(() => {
    if (!form.imageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(form.imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [form.imageFile]);

  // Search and status filter
  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const text = `${banner.title || ""} ${banner.description || ""}`;

      const matchesSearch = text.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && banner.isActive) ||
        (statusFilter === "inactive" && !banner.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [banners, search, statusFilter]);

  const activeCount = banners.filter((banner) => banner.isActive).length;

  // Open create form
  const openAddModal = () => {
    setEditingBanner(null);
    setForm({ ...emptyForm });
    setNotice("");
    setShowModal(true);
  };

  // Open edit form with existing banner data
  const openEditModal = (banner) => {
    setEditingBanner(banner);

    setForm({
      title: banner.title || "",
      description: banner.description || "",
      imageFile: null,
      image: banner.image || "",
      link: banner.link || "/products",
      isActive: Boolean(banner.isActive),
      displayOrder: banner.displayOrder ?? 0,
    });

    setNotice("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingBanner(null);
    setForm({ ...emptyForm });
    setPreviewUrl("");
  };

  // Handle form changes and image validation
  const handleFormChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    if (name === "imageFile") {
      const file = files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showMessage("Please select a valid image file.", "danger");
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showMessage("Image size must be 5 MB or less.", "danger");
        event.target.value = "";
        return;
      }

      setNotice("");

      setForm((previous) => ({
        ...previous,
        imageFile: file,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Create and edit banner
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      showMessage("Please enter a banner title.", "danger");
      return;
    }

    if (!editingBanner && !form.imageFile) {
      showMessage("Please select a banner image.", "danger");
      return;
    }

    const order = Number(form.displayOrder);

    if (!Number.isFinite(order) || order < 0) {
      showMessage("Display order must be zero or greater.", "danger");
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      const data = new FormData();

      data.append("title", form.title.trim());
      data.append("description", form.description);
      data.append("link", form.link.trim());
      data.append("isActive", String(form.isActive));
      data.append("displayOrder", String(order));

      // Image tabhi bhejo jab user ne new image select ki ho.
      // Edit ke waqt empty file hone par existing image rahegi.
      if (form.imageFile) {
        data.append("image", form.imageFile);
      }

      const isEditing = Boolean(editingBanner);

      const url = isEditing
        ? `${BACKEND_URL}/banners/${editingBanner._id}`
        : `${BACKEND_URL}/banners`;

      await request(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: getHeaders(),
        body: data,
      });

      // API save successful hone ke baad modal close karo
      setShowModal(false);
      setEditingBanner(null);
      setForm({ ...emptyForm });

      const refreshed = await fetchBanners();

      showMessage(
        isEditing
          ? refreshed
            ? "Banner updated successfully."
            : "Banner updated, but the list could not refresh."
          : refreshed
            ? "Banner created successfully."
            : "Banner created, but the list could not refresh.",
        refreshed ? "success" : "warning",
      );
    } catch (err) {
      showMessage(err.message || "Unable to save banner.", "danger");
    } finally {
      setSaving(false);
    }
  };

  // Activate / deactivate banner
  const handleToggle = async (banner) => {
    const nextStatus = !banner.isActive;

    if (
      !window.confirm(
        `${nextStatus ? "Activate" : "Deactivate"} "${banner.title}"?`,
      )
    ) {
      return;
    }

    setActionId(banner._id);
    setNotice("");

    try {
      await request(`${BACKEND_URL}/banners/${banner._id}/status`, {
        method: "PATCH",
        headers: getHeaders(true),
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const refreshed = await fetchBanners();

      showMessage(
        refreshed
          ? `Banner ${nextStatus ? "activated" : "deactivated"}.`
          : "Status updated, but the list could not refresh.",
        refreshed ? "success" : "warning",
      );
    } catch (err) {
      showMessage(err.message || "Unable to update status.", "danger");
    } finally {
      setActionId(null);
    }
  };

  // Delete banner
  const handleDelete = async (banner) => {
    if (
      !window.confirm(
        `Delete "${banner.title}" permanently? This cannot be undone.`,
      )
    ) {
      return;
    }

    setActionId(banner._id);
    setNotice("");

    try {
      await request(`${BACKEND_URL}/banners/${banner._id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      setBanners((previous) =>
        previous.filter((item) => item._id !== banner._id),
      );

      showMessage("Banner deleted successfully.");
    } catch (err) {
      showMessage(err.message || "Unable to delete banner.", "danger");
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderStatus = (banner) => (
    <span
      className={`badge ${
        banner.isActive
          ? "bg-success-subtle text-success"
          : "bg-secondary-subtle text-secondary"
      }`}
    >
      {banner.isActive ? "Active" : "Inactive"}
    </span>
  );

  const renderActions = (banner) => (
    <div className="d-flex gap-2 flex-wrap">
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        title="Preview image"
        disabled={!banner.image}
        onClick={() =>
          window.open(banner.image, "_blank", "noopener,noreferrer")
        }
      >
        <FontAwesomeIcon icon={faEye} />
      </button>

      <button
        type="button"
        className="btn btn-sm btn-outline-success"
        title="Edit banner"
        disabled={actionId === banner._id}
        onClick={() => openEditModal(banner)}
      >
        <FontAwesomeIcon icon={faPen} />
      </button>

      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        title={banner.isActive ? "Deactivate" : "Activate"}
        disabled={actionId === banner._id}
        onClick={() => handleToggle(banner)}
      >
        {actionId === banner._id ? (
          <span className="spinner-border spinner-border-sm" />
        ) : (
          <FontAwesomeIcon icon={faPowerOff} />
        )}
      </button>

      <button
        type="button"
        className="btn btn-sm btn-outline-danger"
        title="Delete banner"
        disabled={actionId === banner._id}
        onClick={() => handleDelete(banner)}
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="container-fluid px-2 px-sm-3 px-lg-4 pt-3 pt-md-4 pb-3">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Banner Management</h2>
            <p className="text-secondary mb-0">
              Manage homepage promotions and campaigns.
            </p>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={openAddModal}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Banner
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notice && (
          <div
            className={`alert alert-${noticeType} d-flex justify-content-between gap-2`}
            role="alert"
          >
            <span>{notice}</span>
            <button
              type="button"
              className="btn-close"
              onClick={() => setNotice("")}
              aria-label="Close"
            />
          </div>
        )}

        {/* Statistics */}
        <div className="row g-3 mb-4">
          {[
            {
              title: "Total Banners",
              count: banners.length,
              icon: faBullhorn,
              color: "primary",
            },
            {
              title: "Active",
              count: activeCount,
              icon: faCheck,
              color: "success",
            },
            {
              title: "Inactive",
              count: banners.length - activeCount,
              icon: faPowerOff,
              color: "secondary",
            },
          ].map((item) => (
            <div className="col-12 col-sm-4" key={item.title}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div
                    className={`rounded-3 bg-${item.color}-subtle text-${item.color} d-flex align-items-center justify-content-center`}
                    style={{ width: 48, height: 48 }}
                  >
                    <FontAwesomeIcon icon={item.icon} />
                  </div>

                  <div>
                    <div className="text-secondary small">{item.title}</div>
                    <h3 className="fw-bold mb-0">{item.count}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and filter */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-md">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>

                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search banners..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-3">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger">
            <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
            {error}

            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={fetchBanners}
            >
              Retry
            </button>
          </div>
        )}

        {/* Banner list */}
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="card-header bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">All Banners</h5>
              <span className="badge bg-light text-dark border">
                {filteredBanners.length} results
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
              <p className="text-secondary mt-3 mb-0">Loading banners...</p>
            </div>
          ) : !error && filteredBanners.length === 0 ? (
            <div className="text-center py-5">
              <FontAwesomeIcon
                icon={faImage}
                size="2x"
                className="text-secondary mb-3"
              />
              <h5>No banners found</h5>

              <p className="text-secondary">
                {search || statusFilter !== "all"
                  ? "Try another search or filter."
                  : "Add your first banner to get started."}
              </p>

              {!search && statusFilter === "all" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddModal}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add Banner
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-3 py-3">Banner</th>
                      <th>Order</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th className="text-end px-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBanners.map((banner) => (
                      <tr key={banner._id}>
                        <td className="px-3 py-3">
                          <div className="d-flex align-items-center gap-3">
                            {banner.image ? (
                              <img
                                src={banner.image}
                                alt={banner.title}
                                className="rounded-3 border"
                                style={{
                                  width: 100,
                                  height: 60,
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div className="bg-light rounded-3 p-3">
                                <FontAwesomeIcon icon={faImage} />
                              </div>
                            )}

                            <div>
                              <div className="fw-semibold">{banner.title}</div>
                              <small className="text-secondary">
                                {banner.description || "No description"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>{banner.displayOrder ?? 0}</td>

                        <td className="text-secondary small">
                          {formatDate(banner.createdAt)}
                        </td>

                        <td>{renderStatus(banner)}</td>

                        <td className="px-3">
                          <div className="d-flex justify-content-end">
                            {renderActions(banner)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="d-md-none p-3">
                <div className="row g-3">
                  {filteredBanners.map((banner) => (
                    <div className="col-12" key={banner._id}>
                      <div className="card h-100">
                        {banner.image && (
                          <img
                            src={banner.image}
                            alt={banner.title}
                            className="card-img-top"
                            style={{
                              height: 170,
                              objectFit: "cover",
                            }}
                          />
                        )}

                        <div className="card-body">
                          <div className="d-flex justify-content-between gap-2">
                            <h6 className="fw-bold">{banner.title}</h6>
                            {renderStatus(banner)}
                          </div>

                          <p className="small text-secondary">
                            {banner.description || "No description"}
                          </p>

                          <div className="small text-secondary mb-3">
                            Order: {banner.displayOrder ?? 0} ·{" "}
                            {formatDate(banner.createdAt)}
                          </div>

                          {renderActions(banner)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!loading && !error && filteredBanners.length > 0 && (
            <div className="card-footer bg-white text-secondary small">
              Showing {filteredBanners.length} of {banners.length} banners
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <>
            <style>{modalStyles}</style>

            <div
              className="banner-modal-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeModal();
                }
              }}
            >
              <div
                className="banner-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bannerModalTitle"
              >
                <div className="banner-modal-content">
                  {/* Header */}
                  <div className="modal-header banner-modal-header px-4 py-3">
                    <div>
                      <h5
                        className="modal-title fw-bold mb-1"
                        id="bannerModalTitle"
                      >
                        {editingBanner ? "Edit Banner" : "Create New Banner"}
                      </h5>

                      <small className="text-secondary">
                        {editingBanner
                          ? "Update your banner details"
                          : "Add a new homepage promotional banner"}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeModal}
                      disabled={saving}
                      aria-label="Close"
                    />
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    <div className="banner-modal-body p-4">
                      <div className="row g-3">
                        {/* Title */}
                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Banner Title <span className="text-danger">*</span>
                          </label>

                          <input
                            type="text"
                            name="title"
                            className="form-control"
                            placeholder="e.g. Mega Shopping Sale"
                            value={form.title}
                            onChange={handleFormChange}
                            maxLength={120}
                            required
                          />
                        </div>

                        {/* Description */}
                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Description
                          </label>

                          <textarea
                            name="description"
                            className="form-control"
                            rows={3}
                            placeholder="Write a short promotional description..."
                            value={form.description}
                            onChange={handleFormChange}
                            maxLength={500}
                          />
                        </div>

                        {/* Image */}
                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Banner Image{" "}
                            {!editingBanner && (
                              <span className="text-danger">*</span>
                            )}
                          </label>

                          <input
                            type="file"
                            name="imageFile"
                            className="form-control"
                            accept="image/*"
                            onChange={handleFormChange}
                            required={!editingBanner}
                          />

                          <div className="form-text">
                            Maximum image size: 5 MB.
                            {editingBanner &&
                              " Choose a new image only if you want to replace the current one."}
                          </div>
                        </div>

                        {/* Image preview */}
                        {(previewUrl || form.image) && (
                          <div className="col-12">
                            <label className="form-label fw-semibold">
                              {previewUrl
                                ? "New Image Preview"
                                : "Current Image"}
                            </label>

                            <div className="border rounded-3 p-2 bg-light text-center">
                              <img
                                src={previewUrl || form.image}
                                alt="Banner preview"
                                className="img-fluid rounded-2"
                                style={{
                                  width: "100%",
                                  maxHeight: "220px",
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Redirect link */}
                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Redirect Link
                          </label>

                          <input
                            type="text"
                            name="link"
                            className="form-control"
                            placeholder="/products"
                            value={form.link}
                            onChange={handleFormChange}
                          />

                          <div className="form-text">Example: /products</div>
                        </div>

                        {/* Order */}
                        <div className="col-12 col-sm-6">
                          <label className="form-label fw-semibold">
                            Display Order
                          </label>

                          <input
                            type="number"
                            name="displayOrder"
                            className="form-control"
                            min="0"
                            step="1"
                            value={form.displayOrder}
                            onChange={handleFormChange}
                            required
                          />
                        </div>

                        {/* Active toggle */}
                        <div className="col-12 col-sm-6">
                          <div className="border rounded-3 p-3 h-100">
                            <div className="form-check form-switch">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="bannerActive"
                                name="isActive"
                                role="switch"
                                checked={form.isActive}
                                onChange={handleFormChange}
                              />

                              <label
                                htmlFor="bannerActive"
                                className="form-check-label fw-semibold"
                              >
                                Active Banner
                              </label>
                            </div>

                            <small className="text-secondary">
                              Show this banner on the homepage.
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer banner-modal-footer px-4 py-3">
                      <button
                        type="button"
                        className="btn btn-light border"
                        onClick={closeModal}
                        disabled={saving}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="btn btn-primary px-4"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                            {editingBanner ? "Save Changes" : "Create Banner"}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminBanners;
