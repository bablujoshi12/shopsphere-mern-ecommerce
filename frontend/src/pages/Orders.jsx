import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faTruckFast,
  faCircleCheck,
  faClock,
  faArrowRight,
  faReceipt,
  faBan,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import BACKEND_URL from "../config/api";
import { toast } from "react-toastify";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const getOrders = async () => {
    try {
      const url = `${BACKEND_URL}/orders`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          authorization: localStorage.getItem("token"),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return toast.error(result.message);
      }

      setOrders(result.orders || []);
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, []);

  const filteredOrders =
    activeFilter === "all"
      ? orders
      : activeFilter === "returns"
        ? orders.filter((order) =>
            [
              "return_requested",
              "return_approved",
              "return_rejected",
              "returned",
            ].includes(order.orderStatus),
          )
        : orders.filter((order) => order.orderStatus === activeFilter);

  const getStatusDetails = (status) => {
    switch (status) {
      case "delivered":
        return {
          label: "Delivered",
          className: "order-status-delivered",
          icon: faCircleCheck,
        };

      case "shipped":
        return {
          label: "Shipped",
          className: "order-status-shipped",
          icon: faTruckFast,
        };

      case "processing":
        return {
          label: "Processing",
          className: "order-status-processing",
          icon: faClock,
        };

      case "confirmed":
        return {
          label: "Confirmed",
          className: "order-status-processing",
          icon: faCircleCheck,
        };

      case "cancelled":
        return {
          label: "Cancelled",
          className: "order-status-cancelled",
          icon: faBan,
        };

      case "return_requested":
        return {
          label: "Return Requested",
          className: "order-status-processing",
          icon: faClock,
        };

      case "return_approved":
        return {
          label: "Return Approved",
          className: "order-status-shipped",
          icon: faCircleCheck,
        };

      case "return_rejected":
        return {
          label: "Return Rejected",
          className: "order-status-cancelled",
          icon: faBan,
        };

      case "returned":
        return {
          label: "Return Completed",
          className: "order-status-delivered",
          icon: faRotateLeft,
        };

      default:
        return {
          label: "Pending",
          className: "order-status-processing",
          icon: faClock,
        };
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="orders-page py-5">
        <div className="container text-center">
          <p className="text-muted">Loading orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page py-5">
      <div className="container">
        {/* Header */}
        <div className="orders-header mb-4">
          <div>
            <h2 className="fw-bold mb-1">My Orders</h2>
            <p className="text-muted mb-0">
              Track and manage your recent orders
            </p>
          </div>

          <div className="orders-count">
            <FontAwesomeIcon icon={faBoxOpen} />
            <span>{orders.length} Orders</span>
          </div>
        </div>

        {/* Order Filters */}
        <div className="orders-tabs mb-4">
          <button
            className={`order-tab ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All Orders
          </button>

          <button
            className={`order-tab ${
              activeFilter === "processing" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("processing")}
          >
            Processing
          </button>

          <button
            className={`order-tab ${
              activeFilter === "shipped" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("shipped")}
          >
            Shipped
          </button>

          <button
            className={`order-tab ${
              activeFilter === "delivered" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("delivered")}
          >
            Delivered
          </button>

          <button
            className={`order-tab ${
              activeFilter === "returns" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("returns")}
          >
            Returns
          </button>
        </div>

        {/* Empty Orders */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-5">
            <FontAwesomeIcon
              icon={faBoxOpen}
              className="text-muted fs-1 mb-3"
            />

            <h5 className="fw-bold">No Orders Found</h5>

            <p className="text-muted">
              {activeFilter === "all"
                ? "You haven't placed any orders yet."
                : activeFilter === "returns"
                  ? "You don't have any return orders yet."
                  : `You don't have any ${activeFilter} orders.`}
            </p>

            {activeFilter === "all" && (
              <button
                className="btn btn-primary"
                onClick={() => navigate("/products")}
              >
                Start Shopping
              </button>
            )}
          </div>
        ) : (
          /* Orders */
          <div className="orders-list">
            {filteredOrders.map((order) => {
              const status = getStatusDetails(order.orderStatus);

              return (
                <div className="order-card" key={order._id}>
                  {/* Order Header */}
                  <div className="order-card-header">
                    <div>
                      <div className="order-id">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </div>

                      <small className="text-muted">
                        Placed on {formatDate(order.createdAt)}
                      </small>
                    </div>

                    <div className={`order-status ${status.className}`}>
                      <FontAwesomeIcon icon={status.icon} />
                      <span>{status.label}</span>
                    </div>
                  </div>

                  {/* Products */}
                  {order.items.map((item) => (
                    <div
                      className="order-product"
                      key={item.product?._id || item.product}
                    >
                      <div className="order-product-image">
                        <img
                          src={
                            item.image ||
                            item.product?.images?.[0] ||
                            "https://placehold.co/120x120/f8f9fa/0d6efd?text=Product"
                          }
                          alt={item.name}
                        />
                      </div>

                      <div className="order-product-info">
                        <h5>{item.name}</h5>

                        <p className="text-muted mb-1">
                          Quantity: {item.quantity}
                        </p>

                        <strong>₹{item.price * item.quantity}</strong>
                      </div>
                    </div>
                  ))}

                  {/* Footer */}
                  <div className="order-card-footer">
                    <div>
                      <small className="text-muted d-block">Total Amount</small>

                      <strong className="order-total">
                        ₹{order.totalAmount}
                      </strong>
                    </div>

                    <div className="order-actions">
                      {/* View Details */}
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        <FontAwesomeIcon icon={faReceipt} className="me-2" />
                        View Details
                      </button>

                      {/* Track Order */}
                      {![
                        "delivered",
                        "cancelled",
                        "returned",
                        "return_requested",
                        "return_approved",
                        "return_rejected",
                      ].includes(order.orderStatus) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/orders/${order._id}/track`)}
                        >
                          <FontAwesomeIcon
                            icon={faTruckFast}
                            className="me-2"
                          />
                          Track Order
                        </button>
                      )}

                      {/* Buy Again */}
                      {order.orderStatus === "delivered" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate("/products")}
                        >
                          Buy Again
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="ms-2"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default Orders;
