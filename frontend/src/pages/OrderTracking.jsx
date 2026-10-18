import React, { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faArrowLeft,
  faBoxOpen,
  faCircleCheck,
  faClock,
  faTruckFast,
  faBan,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL from "../config/api";
import { toast } from "react-toastify";

function OrderTracking() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const getOrder = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/orders/${id}`, {
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

  useEffect(() => {
    getOrder();
  }, [id]);

  const trackingSteps = [
    {
      status: "pending",
      label: "Order Placed",
      icon: faBoxOpen,
    },
    {
      status: "confirmed",
      label: "Confirmed",
      icon: faCircleCheck,
    },
    {
      status: "processing",
      label: "Processing",
      icon: faClock,
    },
    {
      status: "shipped",
      label: "Shipped",
      icon: faTruckFast,
    },
    {
      status: "delivered",
      label: "Delivered",
      icon: faCircleCheck,
    },
  ];

  const statusOrder = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  const getStepState = (stepStatus) => {
    const currentIndex = statusOrder.indexOf(order.orderStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (currentIndex === -1) {
      return "upcoming";
    }

    // Delivered hone par saare steps completed honge
    if (order.orderStatus === "delivered") {
      return "completed";
    }

    if (stepIndex < currentIndex) {
      return "completed";
    }

    if (stepIndex === currentIndex) {
      return "current";
    }

    return "upcoming";
  };

  const getReturnStatus = (status) => {
    switch (status) {
      case "return_requested":
        return {
          title: "Return Request Submitted",
          message:
            "Your return request has been submitted and is waiting for admin review.",
          className: "text-warning",
          icon: faClock,
        };

      case "return_approved":
        return {
          title: "Return Approved",
          message:
            "Your return request has been approved. The product must be received and inspected before the return is completed.",
          className: "text-primary",
          icon: faCircleCheck,
        };

      case "return_rejected":
        return {
          title: "Return Request Rejected",
          message:
            "Your return request was rejected. Please contact support if you need further assistance.",
          className: "text-danger",
          icon: faBan,
        };

      case "returned":
        return {
          title: "Return Completed",
          message: "Your return has been marked as completed by the admin.",
          className: "text-success",
          icon: faRotateLeft,
        };

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <main className="py-5">
        <div className="container text-center">
          <p className="text-muted">Loading tracking...</p>
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

  const returnStatus = getReturnStatus(order.orderStatus);

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

          <h2 className="fw-bold mb-1">
            {returnStatus ? "Return Tracking" : "Track Order"}
          </h2>

          <p className="text-muted mb-0">
            Order #{order._id.slice(-6).toUpperCase()}
          </p>
        </div>

        {/* Cancelled Order */}
        {order.orderStatus === "cancelled" && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 text-center">
              <FontAwesomeIcon icon={faBan} className="text-danger fs-1 mb-3" />

              <h4 className="fw-bold">Order Cancelled</h4>

              <p className="text-muted mb-0">This order has been cancelled.</p>
            </div>
          </div>
        )}

        {/* Return Status */}
        {returnStatus && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5 text-center">
              <FontAwesomeIcon
                icon={returnStatus.icon}
                className={`${returnStatus.className} fs-1 mb-3`}
              />

              <h4 className="fw-bold">{returnStatus.title}</h4>

              <p className="text-muted mb-0">{returnStatus.message}</p>

              {order.returnReason && (
                <div className="bg-light rounded p-3 mt-4 text-start">
                  <strong>Return Reason:</strong>

                  <p className="text-muted mb-0 mt-1">{order.returnReason}</p>
                </div>
              )}

              {order.returnRequestedAt && (
                <p className="text-muted small mt-3 mb-0">
                  Requested on:{" "}
                  {new Date(order.returnRequestedAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </p>
              )}

              {order.orderStatus === "returned" && order.returnReceivedAt && (
                <p className="text-muted small mt-2 mb-0">
                  Return completed on:{" "}
                  {new Date(order.returnReceivedAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Normal Delivery Tracking */}
        {![
          "cancelled",
          "return_requested",
          "return_approved",
          "return_rejected",
          "returned",
        ].includes(order.orderStatus) && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <h5 className="fw-bold mb-5">Order Status</h5>

              {trackingSteps.map((step, index) => {
                const stepState = getStepState(step.status);
                const isLast = index === trackingSteps.length - 1;

                return (
                  <div key={step.status}>
                    <div className="d-flex align-items-center gap-3">
                      {/* Icon */}
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          stepState === "completed"
                            ? "bg-success text-white"
                            : stepState === "current"
                              ? "bg-primary text-white"
                              : "bg-light text-muted"
                        }`}
                        style={{
                          width: "50px",
                          height: "50px",
                          minWidth: "50px",
                        }}
                      >
                        <FontAwesomeIcon icon={step.icon} />
                      </div>

                      {/* Text */}
                      <div>
                        <h6
                          className={`fw-bold mb-1 ${
                            stepState === "upcoming" ? "text-muted" : ""
                          }`}
                        >
                          {step.label}
                        </h6>

                        {stepState === "completed" && (
                          <small className="text-success">Completed</small>
                        )}

                        {stepState === "current" && (
                          <small className="text-primary">Current Status</small>
                        )}

                        {stepState === "upcoming" && (
                          <small className="text-muted">Pending</small>
                        )}
                      </div>
                    </div>

                    {/* Connector */}
                    {!isLast && (
                      <div
                        className={`border-start border-2 ${
                          stepState === "completed"
                            ? "border-success"
                            : "border-light"
                        }`}
                        style={{
                          height: "45px",
                          marginLeft: "24px",
                        }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">Order Summary</h5>

            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Items</span>
              <span>{order.items.length}</span>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Payment</span>
              <span>{order.paymentMethod}</span>
            </div>

            <div className="d-flex justify-content-between">
              <span className="fw-bold">Total Amount</span>
              <strong className="text-primary">₹{order.totalAmount}</strong>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default OrderTracking;
