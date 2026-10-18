import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowLeft,
  faSearch,
  faPen,
  faTrash,
  faTicket,
  faChevronLeft,
  faChevronRight,
  faRotateRight,
  faTimes,
  faSave,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import BACKEND_URL from "../../config/api";
import { toast } from "react-toastify";
import AdminLayout from "../../components/admin/AdminLayout";

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: 0,
  maxDiscount: "",
  expiryDate: "",
  usageLimit: 100,
  isActive: true,
};

function AdminCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCoupons: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { authorization: token } : {};
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          search,
          status,
          page: String(page),
          limit: String(limit),
        });

        const response = await fetch(
          `${BACKEND_URL}/coupons?${params.toString()}`,
          {
            method: "GET",
            headers: getHeaders(),
            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Coupons fetch nahi ho paye.");
        }

        setCoupons(Array.isArray(result.coupons) ? result.coupons : []);
        setPagination(
          result.pagination || {
            currentPage: page,
            totalPages: 0,
            totalCoupons: 0,
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

    fetchCoupons();
    return () => controller.abort();
  }, [search, status, page, refreshKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTimeInput = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "";

    const localDate = new Date(
      parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000,
    );

    return localDate.toISOString().slice(0, 16);
  };

  const getStatus = (coupon) => {
    const couponStatus = coupon.status
      ? coupon.status.toLowerCase()
      : new Date(coupon.expiryDate) <= new Date()
        ? "expired"
        : !coupon.isActive || coupon.usedCount >= coupon.usageLimit
          ? "inactive"
          : "active";

    if (couponStatus === "expired") {
      return {
        label: "Expired",
        className: "bg-danger-subtle text-danger",
      };
    }

    if (couponStatus === "inactive") {
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

  const getDiscountLabel = (coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }

    return formatPrice(coupon.discountValue);
  };

  const getStartNumber =
    pagination.totalCoupons === 0 ? 0 : (page - 1) * limit + 1;
  const getEndNumber = Math.min(page * limit, pagination.totalCoupons);

  const openAddModal = () => {
    setSelectedCoupon(null);
    setForm({ ...emptyForm });
    setModalMode("add");
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setSelectedCoupon(coupon);
    setForm({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue ?? "",
      minOrderAmount: coupon.minOrderAmount ?? 0,
      maxDiscount: coupon.maxDiscount ?? "",
      expiryDate: formatDateTimeInput(coupon.expiryDate),
      usageLimit: coupon.usageLimit ?? 100,
      isActive: Boolean(coupon.isActive),
    });
    setModalMode("edit");
    setFormError("");
    setShowModal(true);
  };

  const openViewModal = (coupon) => {
    setSelectedCoupon(coupon);
    setModalMode("view");
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedCoupon(null);
    setForm({ ...emptyForm });
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const normalizedCode = form.code.trim().toUpperCase();
    const discountValue = Number(form.discountValue);
    const minOrderAmount = Number(form.minOrderAmount);
    const usageLimit = Number(form.usageLimit);
    const maxDiscount =
      form.maxDiscount === "" ? null : Number(form.maxDiscount);
    const expiryDate = new Date(form.expiryDate);

    if (!normalizedCode || !form.expiryDate || form.discountValue === "") {
      setFormError("Required fields fill karo.");
      return;
    }

    if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
      setFormError(
        "Coupon code 3–30 characters ka ho aur sirf letters, numbers, hyphen ya underscore use kare.",
      );
      return;
    }

    if (!["percentage", "fixed"].includes(form.discountType)) {
      setFormError("Valid discount type select karo.");
      return;
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue < 1 ||
      (form.discountType === "percentage" && discountValue > 100)
    ) {
      setFormError(
        form.discountType === "percentage"
          ? "Percentage discount 1 se 100 ke beech hona chahiye."
          : "Fixed discount kam se kam ₹1 hona chahiye.",
      );
      return;
    }

    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      setFormError("Minimum order amount negative nahi ho sakta.");
      return;
    }

    if (
      form.discountType === "percentage" &&
      maxDiscount !== null &&
      (!Number.isFinite(maxDiscount) || maxDiscount < 0)
    ) {
      setFormError("Maximum discount valid amount hona chahiye.");
      return;
    }

    if (!Number.isInteger(usageLimit) || usageLimit < 1) {
      setFormError("Usage limit positive whole number honi chahiye.");
      return;
    }

    if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      setFormError("Expiry date future mein honi chahiye.");
      return;
    }

    const payload = {
      code: normalizedCode,
      discountType: form.discountType,
      discountValue,
      minOrderAmount,
      maxDiscount: form.discountType === "percentage" ? maxDiscount : null,
      expiryDate: expiryDate.toISOString(),
      usageLimit,
      isActive: form.isActive,
    };

    const isEditing = modalMode === "edit";
    const url = isEditing
      ? `${BACKEND_URL}/coupons/${selectedCoupon._id}`
      : `${BACKEND_URL}/coupons`;

    try {
      setSaving(true);

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          ...getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Coupon save nahi ho paya.");
      }

      setShowModal(false);
      setSelectedCoupon(null);
      setForm({ ...emptyForm });
      setPage(1);
      setSearchInput("");
      setSearch("");
      setStatus("all");
      setRefreshKey((previous) => previous + 1);

      toast.success(
        result.message ||
          (isEditing
            ? "Coupon updated successfully."
            : "Coupon created successfully."),
      );
    } catch (err) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    const confirmed = window.confirm(
      `Kya tum "${coupon.code}" coupon delete karna chahte ho?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${BACKEND_URL}/coupons/${coupon._id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Coupon delete nahi hua.");
      }

      toast.success(result.message || "Coupon deleted successfully.");

      if (coupons.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        setRefreshKey((previous) => previous + 1);
      }
    } catch (err) {
      toast.error(err.message || "Coupon delete nahi hua.");
    }
  };

  const renderStatus = (coupon) => {
    const statusInfo = getStatus(coupon);

    return (
      <span className={`badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-2 px-sm-3 px-lg-4 pt-3 pt-md-4 pb-3">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Coupons</h2>
            <p className="text-muted mb-0">
              Create and manage discount coupons
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 align-self-start"
            style={{ padding: "0.625rem 1rem", whiteSpace: "nowrap" }}
            onClick={openAddModal}
          >
            <FontAwesomeIcon icon={faPlus} />
            Create Coupon
          </button>
        </div>

        {/* Summary */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-muted">Total Coupons</small>
                <h4 className="fw-bold mb-0">{pagination.totalCoupons}</h4>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-muted">On This Page</small>
                <h4 className="fw-bold mb-0">{coupons.length}</h4>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-muted">Active on This Page</small>
                <h4 className="fw-bold text-success mb-0">
                  {
                    coupons.filter(
                      (coupon) => getStatus(coupon).label === "Active",
                    ).length
                  }
                </h4>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-muted">Expired on This Page</small>
                <h4 className="fw-bold text-danger mb-0">
                  {
                    coupons.filter(
                      (coupon) => getStatus(coupon).label === "Expired",
                    ).length
                  }
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-2">
              <div className="col-12 col-lg">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search by coupon code..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setPage(1);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <select
                  className="form-select"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
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
                  <th className="px-3 py-3">Coupon</th>
                  <th>Discount</th>
                  <th>Min. Order</th>
                  <th>Usage</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th className="text-end px-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="spinner-border spinner-border-sm me-2" />
                      Loading coupons...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <FontAwesomeIcon
                        icon={faTicket}
                        size="2x"
                        className="text-muted mb-2"
                      />
                      <p className="mb-0">No coupons found.</p>
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td className="px-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 46, height: 46 }}
                          >
                            <FontAwesomeIcon icon={faTicket} />
                          </div>
                          <div>
                            <div className="fw-semibold">{coupon.code}</div>
                            <small className="text-muted">
                              {coupon.discountType === "percentage"
                                ? "Percentage"
                                : "Fixed"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="fw-semibold text-success">
                          {getDiscountLabel(coupon)}
                        </span>
                        {coupon.discountType === "percentage" &&
                          coupon.maxDiscount != null && (
                            <small className="d-block text-muted">
                              Up to {formatPrice(coupon.maxDiscount)}
                            </small>
                          )}
                      </td>

                      <td>
                        <span className="text-muted small">
                          {formatPrice(coupon.minOrderAmount)}
                        </span>
                      </td>

                      <td>
                        <span className="small">
                          {coupon.usedCount} / {coupon.usageLimit}
                        </span>
                      </td>

                      <td>
                        <span className="text-muted small">
                          {formatDate(coupon.expiryDate)}
                        </span>
                      </td>

                      <td>{renderStatus(coupon)}</td>

                      <td className="text-end px-3">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          title="View coupon"
                          onClick={() => openViewModal(coupon)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success me-2"
                          title="Edit coupon"
                          onClick={() => openEditModal(coupon)}
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete coupon"
                          onClick={() => handleDeleteCoupon(coupon)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            loading={loading}
            start={getStartNumber}
            end={getEndNumber}
            total={pagination.totalCoupons}
            onPageChange={setPage}
          />
        </div>

        {/* Mobile cards */}
        <div className="d-md-none">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm me-2" />
              Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <FontAwesomeIcon
                  icon={faTicket}
                  size="2x"
                  className="text-muted mb-2"
                />
                <p className="mb-0">No coupons found.</p>
              </div>
            </div>
          ) : (
            coupons.map((coupon) => (
              <div className="card border-0 shadow-sm mb-3" key={coupon._id}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 44, height: 44 }}
                      >
                        <FontAwesomeIcon icon={faTicket} />
                      </div>
                      <div>
                        <h6 className="fw-semibold mb-1">{coupon.code}</h6>
                        <small className="text-muted">
                          {coupon.discountType === "percentage"
                            ? "Percentage"
                            : "Fixed"}
                        </small>
                      </div>
                    </div>
                    {renderStatus(coupon)}
                  </div>

                  <div className="row g-2 mt-2">
                    <div className="col-6">
                      <div className="bg-light rounded p-2 h-100">
                        <small className="text-muted d-block">Discount</small>
                        <span className="text-success fw-semibold small">
                          {getDiscountLabel(coupon)}
                        </span>
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="bg-light rounded p-2 h-100">
                        <small className="text-muted d-block">Min. Order</small>
                        <span className="small fw-semibold">
                          {formatPrice(coupon.minOrderAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="bg-light rounded p-2 h-100">
                        <small className="text-muted d-block">Usage</small>
                        <span className="small">
                          {coupon.usedCount} / {coupon.usageLimit}
                        </span>
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="bg-light rounded p-2 h-100">
                        <small className="text-muted d-block">Expiry</small>
                        <span className="small">
                          {formatDate(coupon.expiryDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openViewModal(coupon)}
                    >
                      <FontAwesomeIcon icon={faEye} className="me-1" />
                      View
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => openEditModal(coupon)}
                    >
                      <FontAwesomeIcon icon={faPen} className="me-1" />
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteCoupon(coupon)}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                loading={loading}
                start={getStartNumber}
                end={getEndNumber}
                total={pagination.totalCoupons}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>

        {/* Add / Edit / View modal */}
        {showModal && (
          <div
            className="coupon-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <div className="coupon-modal-dialog">
              <div className="coupon-modal-content">
                <div className="d-flex justify-content-between align-items-center border-bottom p-3 p-md-4">
                  <div>
                    <h5 className="fw-bold mb-1">
                      {modalMode === "add"
                        ? "Create Coupon"
                        : modalMode === "edit"
                          ? "Edit Coupon"
                          : "Coupon Details"}
                    </h5>
                    <small className="text-muted">
                      {modalMode === "view"
                        ? "Coupon information"
                        : "Enter coupon and discount details"}
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

                <div className="coupon-modal-body p-3 p-md-4">
                  {formError && (
                    <div className="alert alert-danger">{formError}</div>
                  )}

                  {modalMode === "view" && selectedCoupon ? (
                    <div>
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div
                          className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center"
                          style={{ width: 58, height: 58 }}
                        >
                          <FontAwesomeIcon icon={faTicket} size="lg" />
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1">
                            {selectedCoupon.code}
                          </h5>
                          {renderStatus(selectedCoupon)}
                        </div>
                      </div>

                      <div className="row g-3">
                        {[
                          ["Discount Type", selectedCoupon.discountType],
                          ["Discount Value", getDiscountLabel(selectedCoupon)],
                          [
                            "Minimum Order",
                            formatPrice(selectedCoupon.minOrderAmount),
                          ],
                          [
                            "Maximum Discount",
                            selectedCoupon.maxDiscount == null
                              ? "Not set"
                              : formatPrice(selectedCoupon.maxDiscount),
                          ],
                          [
                            "Usage",
                            `${selectedCoupon.usedCount} / ${selectedCoupon.usageLimit}`,
                          ],
                          [
                            "Expiry Date",
                            formatDate(selectedCoupon.expiryDate),
                          ],
                          ["Active", selectedCoupon.isActive ? "Yes" : "No"],
                          ["Created", formatDate(selectedCoupon.createdAt)],
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

                      <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={closeModal}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label">
                            Coupon Code <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="code"
                            className="form-control text-uppercase"
                            value={form.code}
                            onChange={handleChange}
                            placeholder="e.g. WELCOME10"
                            required
                            maxLength={30}
                            disabled={saving}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Discount Type <span className="text-danger">*</span>
                          </label>
                          <select
                            name="discountType"
                            className="form-select"
                            value={form.discountType}
                            onChange={(event) => {
                              handleChange(event);
                              if (event.target.value === "fixed") {
                                setForm((previous) => ({
                                  ...previous,
                                  discountType: "fixed",
                                  maxDiscount: "",
                                }));
                              }
                            }}
                            disabled={saving}
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₹)</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Discount Value{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            name="discountValue"
                            className="form-control"
                            min="1"
                            max={
                              form.discountType === "percentage"
                                ? "100"
                                : undefined
                            }
                            step="0.01"
                            value={form.discountValue}
                            onChange={handleChange}
                            placeholder={
                              form.discountType === "percentage" ? "10" : "500"
                            }
                            required
                            disabled={saving}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Minimum Order Amount (₹)
                          </label>
                          <input
                            type="number"
                            name="minOrderAmount"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={form.minOrderAmount}
                            onChange={handleChange}
                            disabled={saving}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Maximum Discount (₹)
                          </label>
                          <input
                            type="number"
                            name="maxDiscount"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={
                              form.discountType === "percentage"
                                ? form.maxDiscount
                                : ""
                            }
                            onChange={handleChange}
                            placeholder={
                              form.discountType === "percentage"
                                ? "e.g. 200 (optional)"
                                : "Only for percentage coupons"
                            }
                            disabled={saving || form.discountType === "fixed"}
                          />
                          {form.discountType === "fixed" && (
                            <small className="text-muted">
                              Fixed discount ke liye maximum discount apply nahi
                              hota.
                            </small>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Expiry Date & Time{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            name="expiryDate"
                            className="form-control"
                            value={form.expiryDate}
                            onChange={handleChange}
                            min={formatDateTimeInput(new Date())}
                            required
                            disabled={saving}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Usage Limit <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            name="usageLimit"
                            className="form-control"
                            min="1"
                            step="1"
                            value={form.usageLimit}
                            onChange={handleChange}
                            required
                            disabled={saving}
                          />
                          {modalMode === "edit" && selectedCoupon && (
                            <small className="text-muted">
                              Already used: {selectedCoupon.usedCount}. Limit
                              isse kam nahi honi chahiye.
                            </small>
                          )}
                        </div>

                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              name="isActive"
                              id="couponActive"
                              className="form-check-input"
                              checked={form.isActive}
                              onChange={handleChange}
                              disabled={saving}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="couponActive"
                            >
                              Active Coupon
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
                                ? "Create Coupon"
                                : "Update Coupon"}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
        .coupon-back-btn {
          transition: all 0.2s ease-in-out;
        }

        .coupon-back-btn:hover {
          background-color: #6c757d;
          border-color: #6c757d;
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(108, 117, 125, 0.2);
        }

        .coupon-back-btn:focus-visible {
          outline: 2px solid #6c757d;
          outline-offset: 2px;
        }

        .coupon-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1060;
          background: rgba(15, 23, 42, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .coupon-modal-dialog {
          width: 100%;
          max-width: 720px;
          max-height: 100%;
          margin: auto;
        }

        .coupon-modal-content {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .coupon-modal-body {
          max-height: calc(100vh - 150px);
          overflow-y: auto;
        }

        @media (max-width: 576px) {
          .coupon-modal-overlay {
            padding: 8px;
          }

          .coupon-modal-body {
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
        Showing {start}–{end} of {total} coupons
      </small>

      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange((current) => current - 1)}
          aria-label="Previous page"
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
          aria-label="Next page"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}

export default AdminCoupons;
