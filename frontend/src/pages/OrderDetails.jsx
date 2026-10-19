import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBoxOpen,
  faTruckFast,
  faCircleCheck,
  faClock,
  faBan,
  faRotateLeft,
  faLocationDot,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";
import BACKEND_URL from "../config/api";
import { toast } from "react-toastify";

function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancel Order Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Return Modal States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);

  const getOrder = async () => {
    try {
      const url = `${BACKEND_URL}/orders/${id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          authorization: localStorage.getItem("token"),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message);
        return;
      }

      setOrder(result.order);
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Open Cancel Order Modal
  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  // Confirm Cancel Order
  const handleConfirmCancelOrder = async () => {
    try {
      setCancelLoading(true);

      const url = `${BACKEND_URL}/orders/${id}/cancel`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          authorization: localStorage.getItem("token"),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOrder(result.order);
      setShowCancelModal(false);
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setCancelLoading(false);
    }
  };

  // Open Return Modal
  const handleReturnOrder = () => {
    setReturnReason("");
    setShowReturnModal(true);
  };

  // Submit Return Request
  const handleSubmitReturn = async (e) => {
    e.preventDefault();

    if (!returnReason.trim()) {
      toast.error("Return reason is required");
      return;
    }

    try {
      setReturnLoading(true);

      const url = `${BACKEND_URL}/orders/${id}/return`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          returnReason: returnReason.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOrder(result.order);
      setShowReturnModal(false);
      setReturnReason("");
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setReturnLoading(false);
    }
  };

  useEffect(() => {
    getOrder();
  }, [id]);

  const getStatusDetails = (status) => {
    switch (status) {
      case "delivered":
        return {
          label: "Delivered",
          className: "text-success",
          icon: faCircleCheck,
        };

      case "shipped":
        return {
          label: "Shipped",
          className: "text-primary",
          icon: faTruckFast,
        };

      case "processing":
        return {
          label: "Processing",
          className: "text-warning",
          icon: faClock,
        };

      case "confirmed":
        return {
          label: "Confirmed",
          className: "text-primary",
          icon: faCircleCheck,
        };

      case "cancelled":
        return {
          label: "Cancelled",
          className: "text-danger",
          icon: faBan,
        };

      case "return_requested":
        return {
          label: "Return Request Pending",
          className: "text-warning",
          icon: faClock,
        };

      case "return_approved":
        return {
          label: "Return Approved",
          className: "text-primary",
          icon: faCircleCheck,
        };

      case "return_rejected":
        return {
          label: "Return Rejected",
          className: "text-danger",
          icon: faBan,
        };

      case "returned":
        return {
          label: "Return Completed",
          className: "text-success",
          icon: faRotateLeft,
        };

      default:
        return {
          label: "Pending",
          className: "text-warning",
          icon: faClock,
        };
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="py-5">
        <div className="container text-center">
          <p className="text-muted">Loading order...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="py-5">
        <div className="container text-center">
          <h5 className="fw-bold">Order not found</h5>

          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/orders")}
          >
            Back to Orders
          </button>
        </div>
      </main>
    );
  }

  const status = getStatusDetails(order.orderStatus);

  return (
    <main className="py-5">
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <button
            className="btn btn-link text-decoration-none p-0 mb-3"
            onClick={() => navigate("/orders")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Orders
          </button>

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="fw-bold mb-1">Order Details</h2>

              <p className="text-muted mb-0">
                Order #{order._id.slice(-6).toUpperCase()}
              </p>
            </div>

            <div className={`fw-semibold ${status.className}`}>
              <FontAwesomeIcon icon={status.icon} className="me-2" />
              {status.label}
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* LEFT */}
          <div className="col-lg-8">
            {/* Order Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <FontAwesomeIcon icon={faBoxOpen} className="text-primary" />
                  <h5 className="fw-bold mb-0">Order Information</h5>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <small className="text-muted d-block">Order ID</small>
                    <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                  </div>

                  <div className="col-md-6">
                    <small className="text-muted d-block">Order Date</small>
                    <strong>{formatDate(order.createdAt)}</strong>
                  </div>

                  <div className="col-md-6">
                    <small className="text-muted d-block">Payment Method</small>
                    <strong>{order.paymentMethod}</strong>
                  </div>

                  <div className="col-md-6">
                    <small className="text-muted d-block">Payment Status</small>
                    <strong className="text-capitalize">
                      {order.paymentStatus}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Ordered Products</h5>

                {order.items.map((item, index) => (
                  <div
                    className="d-flex align-items-center gap-3 py-3 border-bottom"
                    key={item.product?._id || item.product || index}
                  >
                    <div
                      className="bg-light rounded p-2"
                      style={{
                        width: "90px",
                        height: "90px",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={
                          item.image ||
                          item.product?.images?.[0] ||
                          "https://placehold.co/90x90/f8f9fa/0d6efd?text=Product"
                        }
                        alt={item.name}
                        className="img-fluid rounded w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    </div>

                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-1">{item.name}</h6>

                      <p className="text-muted mb-1">
                        Quantity: {item.quantity}
                      </p>

                      <span className="text-primary fw-semibold">
                        ₹{item.price} × {item.quantity}
                      </span>
                    </div>

                    <strong>₹{item.price * item.quantity}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-primary"
                  />
                  <h5 className="fw-bold mb-0">Shipping Address</h5>
                </div>

                <h6 className="fw-bold mb-2">
                  {order.shippingAddress?.fullName}
                </h6>

                <p className="text-muted mb-1">
                  Mobile: {order.shippingAddress?.mobile}
                </p>

                <p className="text-muted mb-1">
                  {order.shippingAddress?.houseNo},{" "}
                  {order.shippingAddress?.street}
                </p>

                <p className="text-muted mb-1">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                  - {order.shippingAddress?.pincode}
                </p>

                <p className="text-muted mb-0">
                  {order.shippingAddress?.country}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-lg-4">
            {/* Status */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Order Status</h5>

                <div className={`fs-5 fw-semibold ${status.className}`}>
                  <FontAwesomeIcon icon={status.icon} className="me-2" />
                  {status.label}
                </div>

                {/* Cancel Order */}
                {["pending", "confirmed", "processing"].includes(
                  order.orderStatus,
                ) && (
                  <button
                    className="btn btn-outline-danger w-100 mt-3"
                    onClick={handleCancelOrder}
                  >
                    <FontAwesomeIcon icon={faBan} className="me-2" />
                    Cancel Order
                  </button>
                )}

                {/* Return Order */}
                {order.orderStatus === "delivered" && (
                  <button
                    className="btn btn-outline-warning w-100 mt-3"
                    onClick={handleReturnOrder}
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
                    Return Order
                  </button>
                )}

                {/* Return Information */}
                {[
                  "return_requested",
                  "return_approved",
                  "return_rejected",
                  "returned",
                ].includes(order.orderStatus) && (
                  <div className="alert alert-light border mt-3 mb-0">
                    <h6 className="fw-bold mb-2">Return Information</h6>

                    <p className="mb-2">
                      <strong>Status:</strong> {status.label}
                    </p>

                    {order.returnReason && (
                      <p className="mb-2">
                        <strong>Your Return Reason:</strong>{" "}
                        {order.returnReason}
                      </p>
                    )}

                    {order.returnRequestedAt && (
                      <p className="text-muted small mt-2 mb-0">
                        Requested on: {formatDate(order.returnRequestedAt)}
                      </p>
                    )}

                    {/* Return Approved Message */}
                    {order.orderStatus === "return_approved" && (
                      <p className="text-muted small mt-2 mb-0">
                        Your return is approved. The product must be received
                        and inspected before the return is completed.
                      </p>
                    )}

                    {/* Admin's Rejection Reason */}
                    {order.orderStatus === "return_rejected" && (
                      <div className="alert alert-danger mt-3 mb-0">
                        <h6 className="fw-bold mb-2">
                          Return Request Rejected
                        </h6>

                        {order.returnRejectionReason ? (
                          <p className="mb-0">
                            <strong>Rejection Reason:</strong>{" "}
                            {order.returnRejectionReason}
                          </p>
                        ) : (
                          <p className="mb-0">
                            Your return request was rejected. Please contact
                            support if you need further assistance.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Return Completed Message */}
                    {order.orderStatus === "returned" && (
                      <p className="text-success small mt-2 mb-0">
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="me-2"
                        />
                        Your return has been completed.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Price Summary */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <FontAwesomeIcon
                    icon={faCreditCard}
                    className="text-primary"
                  />
                  <h5 className="fw-bold mb-0">Price Summary</h5>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Discount</span>
                  <span className="text-success">-₹{order.discount}</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Delivery</span>
                  <span className="text-success">
                    {order.shippingCharge === 0
                      ? "Free"
                      : `₹${order.shippingCharge}`}
                  </span>
                </div>

                <hr />

                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Total Amount</span>
                  <strong className="text-primary fs-5">
                    ₹{order.totalAmount}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Bootstrap Modal */}
      {showCancelModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelModalTitle"
            onClick={(e) => {
              if (e.target === e.currentTarget && !cancelLoading) {
                setShowCancelModal(false);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold" id="cancelModalTitle">
                    <FontAwesomeIcon
                      icon={faBan}
                      className="text-danger me-2"
                    />
                    Cancel Order
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    disabled={cancelLoading}
                    onClick={() => setShowCancelModal(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  Are you sure you want to cancel this order? This action cannot
                  be undone.
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light border"
                    disabled={cancelLoading}
                    onClick={() => setShowCancelModal(false)}
                  >
                    Keep Order
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={cancelLoading}
                    onClick={handleConfirmCancelOrder}
                  >
                    {cancelLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faBan} className="me-2" />
                        Yes, Cancel Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            className="modal-backdrop fade show"
            onClick={() => {
              if (!cancelLoading) {
                setShowCancelModal(false);
              }
            }}
          ></div>
        </>
      )}

      {/* Return Order Bootstrap Modal */}
      {showReturnModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="returnModalTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget && !returnLoading) {
              setShowReturnModal(false);
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSubmitReturn}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold" id="returnModalTitle">
                    <FontAwesomeIcon
                      icon={faRotateLeft}
                      className="text-warning me-2"
                    />
                    Request Product Return
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    disabled={returnLoading}
                    onClick={() => setShowReturnModal(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <p className="text-muted mb-3">
                    Please tell us why you want to return this order.
                  </p>

                  <label
                    htmlFor="returnReason"
                    className="form-label fw-semibold"
                  >
                    Return Reason <span className="text-danger">*</span>
                  </label>

                  <textarea
                    id="returnReason"
                    className="form-control"
                    rows="4"
                    placeholder="Enter your reason for returning this order..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    maxLength={500}
                    required
                    disabled={returnLoading}
                  ></textarea>

                  <div className="d-flex justify-content-between mt-2">
                    <small className="text-muted">
                      Please provide a clear reason.
                    </small>

                    <small className="text-muted">
                      {returnReason.length}/500
                    </small>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light border"
                    disabled={returnLoading}
                    onClick={() => setShowReturnModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={returnLoading || !returnReason.trim()}
                  >
                    {returnLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
                        Submit Return Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showReturnModal && (
        <div
          className="modal-backdrop fade show"
          onClick={() => {
            if (!returnLoading) {
              setShowReturnModal(false);
            }
          }}
        ></div>
      )}
    </main>
  );
}

export default OrderDetails;
