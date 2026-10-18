import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  faSearch,
  faBox,
  faCreditCard,
  faEye,
  faRotateLeft,
  faCheck,
  faXmark,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BACKEND_URL from "../../config/api";
import AdminLayout from "../../components/admin/AdminLayout";

function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const getToken = () => localStorage.getItem("token");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please login as admin first.");
      }

      const response = await fetch(`${BACKEND_URL}/orders/admin/all`, {
        headers: {
          Authorization: token,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch orders.");
      }

      setOrders(result.orders || []);

      setSelectedOrder((current) => {
        if (!current) return current;

        return (
          (result.orders || []).find((order) => order._id === current._id) ||
          current
        );
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const [actionDialog, setActionDialog] = useState(null);
  const [dialogValue, setDialogValue] = useState("");

  // Approve, reject, or complete a return
  const performAction = (orderId, action) => {
    const actionNames = {
      approve: "approve this return request",
      reject: "reject this return request",
      complete: "mark this return as completed",
    };
    setDialogValue("");
    setActionDialog({
      type: action === "reject" ? "reason-confirm" : "confirm",
      title: action === "reject" ? "Reject Return Request" : "Confirm Action",
      message: `Are you sure you want to ${actionNames[action]}?`,
      orderId,
      action,
    });
  };

  const updateStatus = (orderId, orderStatus) => {
    const order =
      orders.find((item) => item._id === orderId) ||
      (selectedOrder?._id === orderId ? selectedOrder : null);
    const isCodDelivery =
      orderStatus === "delivered" &&
      order?.paymentMethod?.toLowerCase() === "cod";

    setDialogValue("");
    setActionDialog({
      type: isCodDelivery ? "cod-confirm" : "confirm-status",
      title: isCodDelivery ? "Confirm COD Payment" : "Update Order Status",
      message: isCodDelivery
        ? "Was the COD payment received?"
        : `Change order status to ${getStatusLabel(orderStatus)}?`,
      orderId,
      orderStatus,
      isCodDelivery,
    });
  };

  const confirmDialogAction = async () => {
    if (!actionDialog) return;
    const dialog = actionDialog;
    let rejectionReason = "";
    let confirmedPaymentCollected;

    if (dialog.type === "reason-confirm") {
      rejectionReason = dialogValue.trim();
      if (!rejectionReason) {
        setError("Rejection reason is required.");
        return;
      }
    }
    if (dialog.type === "cod-confirm") {
      if (!["yes", "no"].includes(dialogValue)) {
        setError("Please select whether COD payment was received.");
        return;
      }
      confirmedPaymentCollected = dialogValue === "yes";
    }

    setActionDialog(null);
    setActionLoading(`${dialog.orderId}-${dialog.action || "status"}`);
    setError("");
    setMessage("");

    try {
      const token = getToken();
      if (!token) throw new Error("Please login as admin first.");

      let url;
      let requestBody;
      if (dialog.action) {
        const routeActions = {
          approve: "return/approve",
          reject: "return/reject",
          complete: "return/complete",
        };
        url = `${BACKEND_URL}/orders/${dialog.orderId}/${routeActions[dialog.action]}`;
        requestBody = dialog.action === "reject" ? { rejectionReason } : {};
      } else {
        url = `${BACKEND_URL}/orders/${dialog.orderId}/status`;
        requestBody = { orderStatus: dialog.orderStatus };
        if (dialog.isCodDelivery)
          requestBody.paymentCollected = confirmedPaymentCollected;
      }

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Action failed.");
      }

      setMessage(result.message || "Order updated successfully.");
      if (dialog.action) {
        await fetchOrders();
        if (result.order) {
          setSelectedOrder((current) =>
            current?._id === dialog.orderId ? result.order : current,
          );
        }
      } else if (result.order) {
        setOrders((current) =>
          current.map((item) =>
            item._id === dialog.orderId ? { ...item, ...result.order } : item,
          ),
        );
        setSelectedOrder((current) =>
          current?._id === dialog.orderId
            ? { ...current, ...result.order }
            : current,
        );
      } else {
        await fetchOrders();
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setActionLoading("");
      setDialogValue("");
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const getCustomerName = (order) =>
    order.shippingAddress?.fullName || order.user?.username || "Customer";

  const getCustomerEmail = (order) => order.user?.email || "—";

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      return_requested: "Return Request Pending",
      return_approved: "Return Approved",
      return_rejected: "Return Rejected",
      returned: "Returned",
    };

    return labels[status] || status || "Unknown";
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: "bg-secondary-subtle text-secondary",
      confirmed: "bg-info-subtle text-info-emphasis",
      processing: "bg-warning-subtle text-warning-emphasis",
      shipped: "bg-primary-subtle text-primary",
      delivered: "bg-success-subtle text-success",
      cancelled: "bg-danger-subtle text-danger",
      return_requested: "bg-warning-subtle text-warning-emphasis",
      return_approved: "bg-info-subtle text-info-emphasis",
      return_rejected: "bg-danger-subtle text-danger",
      returned: "bg-success-subtle text-success",
    };

    return classes[status] || "bg-secondary-subtle text-secondary";
  };

  const getNextStatusOptions = (status) => {
    const nextStatuses = {
      pending: [{ value: "confirmed", label: "Confirm Order" }],
      confirmed: [{ value: "processing", label: "Start Processing" }],
      processing: [{ value: "shipped", label: "Mark as Shipped" }],
      shipped: [{ value: "delivered", label: "Mark as Delivered" }],
    };

    return nextStatuses[status] || [];
  };

  // Compact Update Status dropdown
  const renderStatusUpdater = (order) => {
    const options = getNextStatusOptions(order.orderStatus);

    if (options.length === 0) return null;

    return (
      <div style={{ minWidth: "170px", maxWidth: "190px" }}>
        <select
          className="form-select form-select-sm border-primary"
          value=""
          aria-label={`Update status for order ${order._id}`}
          disabled={Boolean(actionLoading)}
          onChange={(event) => {
            const nextStatus = event.target.value;

            if (nextStatus) {
              updateStatus(order._id, nextStatus);
            }
          }}
        >
          <option value="" disabled>
            Update Status
          </option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderActions = (order) => (
    <div className="d-flex flex-wrap align-items-center gap-2">
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        title="View order details"
        onClick={() => setSelectedOrder(order)}
      >
        <FontAwesomeIcon icon={faEye} className="me-1" />
        View
      </button>

      {renderStatusUpdater(order)}

      {order.orderStatus === "return_requested" && (
        <>
          <button
            type="button"
            className="btn btn-sm btn-success"
            disabled={Boolean(actionLoading)}
            onClick={() => performAction(order._id, "approve")}
          >
            <FontAwesomeIcon icon={faCheck} className="me-1" />
            {actionLoading === `${order._id}-approve`
              ? "Approving..."
              : "Approve"}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            disabled={Boolean(actionLoading)}
            onClick={() => performAction(order._id, "reject")}
          >
            <FontAwesomeIcon icon={faXmark} className="me-1" />
            {actionLoading === `${order._id}-reject`
              ? "Rejecting..."
              : "Reject"}
          </button>
        </>
      )}

      {order.orderStatus === "return_approved" && (
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={Boolean(actionLoading)}
          onClick={() => performAction(order._id, "complete")}
        >
          <FontAwesomeIcon icon={faCheck} className="me-1" />
          {actionLoading === `${order._id}-complete`
            ? "Completing..."
            : "Complete Return"}
        </button>
      )}
    </div>
  );

  const filteredOrders = orders.filter((order) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      order._id?.toLowerCase().includes(searchText) ||
      getCustomerName(order).toLowerCase().includes(searchText) ||
      getCustomerEmail(order).toLowerCase().includes(searchText) ||
      order.items?.some((item) =>
        item.name?.toLowerCase().includes(searchText),
      );

    const matchesStatus =
      statusFilter === "all" || order.orderStatus === statusFilter;

    const matchesPayment =
      paymentFilter === "all" || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const returnCount = orders.filter(
    (order) => order.orderStatus === "return_requested",
  ).length;

  const deliveredCount = orders.filter((order) =>
    Boolean(order.deliveredAt),
  ).length;

  return (
    <AdminLayout>
      <div className="container-fluid px-2 px-sm-3 px-lg-4 pt-3 pt-md-4 pb-3">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Orders Management</h2>
            <p className="text-muted mb-0">
              Manage customer orders, delivery status and return requests
            </p>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-muted">Total Orders</small>
                <h3 className="fw-bold mb-0">{orders.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-muted">Return Requests</small>
                <h3 className="fw-bold mb-0 text-warning">{returnCount}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-muted">Delivered Orders</small>
                <h3 className="fw-bold mb-0 text-success">{deliveredCount}</h3>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success" role="alert">
            {message}
          </div>
        )}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-lg-5">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search order, customer or product..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All Order Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="return_requested">Return Requested</option>
                  <option value="return_approved">Return Approved</option>
                  <option value="return_rejected">Return Rejected</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <select
                  className="form-select"
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Payment Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-3 mb-0">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <FontAwesomeIcon
                icon={faBox}
                size="2x"
                className="text-muted mb-3"
              />
              <h5>No orders found</h5>
              <p className="text-muted mb-0">
                Try changing your search or filters.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="card border-0 shadow-sm d-none d-md-block">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-3 py-3">Order</th>
                      <th className="py-3">Customer</th>
                      <th className="py-3">Products</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Total</th>
                      <th className="py-3">Payment</th>
                      <th className="py-3">Status</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 40, height: 40 }}
                            >
                              <FontAwesomeIcon icon={faBox} />
                            </div>

                            <div>
                              <div className="fw-semibold">
                                #{order._id.slice(-8).toUpperCase()}
                              </div>
                              <small className="text-muted">
                                Qty:{" "}
                                {order.items?.reduce(
                                  (sum, item) => sum + item.quantity,
                                  0,
                                ) || 0}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="fw-semibold small">
                            {getCustomerName(order)}
                          </div>
                          <small className="text-muted">
                            {getCustomerEmail(order)}
                          </small>
                        </td>

                        <td>
                          <div className="small">
                            {order.items?.map((item) => item.name).join(", ") ||
                              "—"}
                          </div>
                        </td>

                        <td className="text-muted small">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="fw-semibold">
                          {formatAmount(order.totalAmount)}
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              order.paymentStatus === "paid"
                                ? "bg-success-subtle text-success"
                                : order.paymentStatus === "failed"
                                  ? "bg-danger-subtle text-danger"
                                  : "bg-warning-subtle text-warning-emphasis"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faCreditCard}
                              className="me-1"
                            />
                            {order.paymentStatus || "pending"}
                          </span>

                          <small className="d-block text-muted mt-1">
                            {order.paymentMethod}
                          </small>
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusClass(
                              order.orderStatus,
                            )}`}
                          >
                            {getStatusLabel(order.orderStatus)}
                          </span>
                        </td>

                        <td className="px-3">{renderActions(order)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card-footer bg-white text-muted small">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            </div>

            <div className="d-md-none">
              {filteredOrders.map((order) => (
                <div className="card border-0 shadow-sm mb-3" key={order._id}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold">
                          #{order._id.slice(-8).toUpperCase()}
                        </div>
                        <small className="text-muted">
                          {formatDate(order.createdAt)}
                        </small>
                      </div>

                      <span
                        className={`badge ${getStatusClass(order.orderStatus)}`}
                      >
                        {getStatusLabel(order.orderStatus)}
                      </span>
                    </div>

                    <hr />

                    <div className="mb-3">
                      <small className="text-muted d-block">Customer</small>
                      <div className="fw-semibold">
                        {getCustomerName(order)}
                      </div>
                      <small className="text-muted">
                        {getCustomerEmail(order)}
                      </small>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted d-block">Products</small>
                      {order.items?.map((item, index) => (
                        <div
                          key={`${item.product?._id || item.name}-${index}`}
                          className="small"
                        >
                          {item.name} × {item.quantity}
                        </div>
                      ))}
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="bg-light rounded p-2">
                          <small className="text-muted d-block">Total</small>
                          <strong>{formatAmount(order.totalAmount)}</strong>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="bg-light rounded p-2">
                          <small className="text-muted d-block">Payment</small>
                          <strong className="small">
                            {order.paymentStatus || "pending"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {renderActions(order)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {actionDialog && (
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setActionDialog(null);
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{actionDialog.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setActionDialog(null)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <p>{actionDialog.message}</p>
                  {actionDialog.type === "reason-confirm" && (
                    <div>
                      <label className="form-label">Rejection reason</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={dialogValue}
                        onChange={(event) => setDialogValue(event.target.value)}
                        placeholder="Enter reason for rejecting this return"
                      />
                    </div>
                  )}
                  {actionDialog.type === "cod-confirm" && (
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="codPayment"
                          id="codYes"
                          value="yes"
                          checked={dialogValue === "yes"}
                          onChange={(event) =>
                            setDialogValue(event.target.value)
                          }
                        />
                        <label className="form-check-label" htmlFor="codYes">
                          Yes, received
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="codPayment"
                          id="codNo"
                          value="no"
                          checked={dialogValue === "no"}
                          onChange={(event) =>
                            setDialogValue(event.target.value)
                          }
                        />
                        <label className="form-check-label" htmlFor="codNo">
                          No, not received
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setActionDialog(null);
                      setDialogValue("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={confirmDialogAction}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedOrder && (
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedOrder(null);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Order Details</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedOrder(null)}
                    aria-label="Close"
                  />
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <small className="text-muted">Order ID</small>
                    <div className="fw-semibold">{selectedOrder._id}</div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">Customer</small>
                    <div>{getCustomerName(selectedOrder)}</div>
                    <div className="small text-muted">
                      {getCustomerEmail(selectedOrder)}
                    </div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">Shipping Address</small>
                    <div>{selectedOrder.shippingAddress?.fullName}</div>
                    <div>
                      {selectedOrder.shippingAddress?.houseNo}{" "}
                      {selectedOrder.shippingAddress?.street}
                    </div>
                    <div>
                      {selectedOrder.shippingAddress?.city},{" "}
                      {selectedOrder.shippingAddress?.state}{" "}
                      {selectedOrder.shippingAddress?.pincode}
                    </div>
                    <div>{selectedOrder.shippingAddress?.mobile}</div>
                  </div>

                  <hr />

                  <h6>Products</h6>

                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={`${item.product?._id || item.name}-${index}`}
                      className="d-flex justify-content-between gap-3 mb-2"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-nowrap">
                        {formatAmount(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}

                  <hr />

                  <div className="d-flex justify-content-between">
                    <span>Total</span>
                    <strong>{formatAmount(selectedOrder.totalAmount)}</strong>
                  </div>

                  <div className="mt-3">
                    <small className="text-muted">Order Status</small>
                    <div className="mb-2">
                      <span
                        className={`badge ${getStatusClass(
                          selectedOrder.orderStatus,
                        )}`}
                      >
                        {getStatusLabel(selectedOrder.orderStatus)}
                      </span>
                    </div>

                    {renderStatusUpdater(selectedOrder)}
                  </div>

                  {selectedOrder.returnReason && (
                    <div className="alert alert-light border mt-3 mb-0">
                      <strong>
                        <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
                        Return Reason
                      </strong>

                      <p className="mb-0 mt-2">{selectedOrder.returnReason}</p>

                      <small className="text-muted d-block mt-2">
                        Requested: {formatDate(selectedOrder.returnRequestedAt)}
                      </small>

                      {selectedOrder.returnRejectionReason && (
                        <div className="mt-3">
                          <strong>Rejection Reason</strong>
                          <p className="mb-0">
                            {selectedOrder.returnRejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </button>

                  {renderActions(selectedOrder)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminOrders;
