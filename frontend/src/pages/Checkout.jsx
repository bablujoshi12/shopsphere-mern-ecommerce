import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faCreditCard,
  faMoneyBillWave,
  faLock,
  faArrowLeft,
  faTruckFast,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL, { RAZORPAY_KEY_ID } from "../config/api";
import { toast } from "react-toastify";

function Checkout() {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Coupon states
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    mobile: "",
    pincode: "",
    houseNo: "",
    street: "",
    city: "",
    state: "",
    country: "India",
  });

  // Get Cart
  const getCart = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/cart`, {
        method: "GET",
        headers: {
          authorization: localStorage.getItem("token"),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Unable to load cart");
        return;
      }

      const items = result.cart?.items || [];

      if (items.length === 0) {
        toast.error("Your cart is empty");
        navigate("/cart");
        return;
      }

      setCartItems(items);
    } catch (error) {
      console.error("Get cart error:", error);
      toast.error("Something went wrong while loading cart");
    }
  };

  useEffect(() => {
    getCart();
  }, []);

  // Calculate prices
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const discount = cartItems.reduce(
    (sum, item) =>
      sum +
      (item.product.price -
        (item.product.discountPrice || item.product.price)) *
        item.quantity,
    0,
  );

  const eligibleAmount = subtotal - discount;
  const shippingCharge = 0;

  const total = Math.max(0, eligibleAmount - couponDiscount + shippingCharge);

  // Apply Coupon
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (applyingCoupon || loading) return;

    try {
      setApplyingCoupon(true);

      const response = await fetch(`${BACKEND_URL}/coupons/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Unable to apply coupon");
        return;
      }

      const discountAmount = Number(result.couponDiscount) || 0;

      if (discountAmount <= 0) {
        toast.error("This coupon does not provide a discount for your cart");
        return;
      }

      setAppliedCoupon(result.couponCode || code);
      setCouponInput(result.couponCode || code);
      setCouponDiscount(discountAmount);

      toast.success(result.message || "Coupon applied successfully");
    } catch (error) {
      console.error("Apply coupon error:", error);
      toast.error("Something went wrong while applying coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Remove Coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon("");
    setCouponInput("");
    setCouponDiscount(0);

    toast.info("Coupon removed");
  };

  // Address input handler
  const handleChange = (event) => {
    const { name, value } = event.target;

    setShippingAddress((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Validate shipping address
  const validateAddress = () => {
    const { fullName, mobile, pincode, houseNo, street, city, state, country } =
      shippingAddress;

    if (
      !fullName.trim() ||
      !mobile.trim() ||
      !pincode.trim() ||
      !houseNo.trim() ||
      !street.trim() ||
      !city.trim() ||
      !state.trim() ||
      !country.trim()
    ) {
      toast.error("All shipping address fields are required");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      toast.error("Enter a valid 10 digit mobile number");
      return false;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      toast.error("Enter a valid 6 digit pincode");
      return false;
    }

    return true;
  };

  // Place COD Order
  const placeCODOrder = async () => {
    const response = await fetch(`${BACKEND_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("token"),
      },
      body: JSON.stringify({
        shippingAddress,
        paymentMethod: "COD",
        couponCode: appliedCoupon,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.message || "Unable to place order");
      return;
    }

    toast.success(result.message || "Order placed successfully");
    navigate("/orders");
  };

  // Razorpay payment
  const payWithRazorpay = async () => {
    if (!RAZORPAY_KEY_ID) {
      toast.error("Razorpay Key ID is missing");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Razorpay checkout failed to load. Refresh the page.");
      return;
    }

    const createResponse = await fetch(`${BACKEND_URL}/payment/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("token"),
      },
      body: JSON.stringify({
        couponCode: appliedCoupon,
      }),
    });

    const createResult = await createResponse.json();

    if (!createResponse.ok) {
      toast.error(createResult.message || "Unable to initialize payment");
      return;
    }

    const razorpayOrder = createResult.order;

    if (!razorpayOrder?.id) {
      toast.error("Razorpay order ID was not received");
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "ShopSphere",
      description: "ShopSphere Order Payment",
      order_id: razorpayOrder.id,

      prefill: {
        name: shippingAddress.fullName,
        contact: shippingAddress.mobile,
      },

      theme: {
        color: "#0d6efd",
      },

      handler: async (razorpayResponse) => {
        try {
          setLoading(true);

          const verifyResponse = await fetch(`${BACKEND_URL}/payment/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization: localStorage.getItem("token"),
            },
            body: JSON.stringify({
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
              shippingAddress,
            }),
          });

          const verifyResult = await verifyResponse.json();

          if (!verifyResponse.ok) {
            toast.error(verifyResult.message || "Payment verification failed");
            return;
          }

          toast.success(
            verifyResult.message ||
              "Payment verified and order placed successfully",
          );

          navigate("/orders", { replace: true });
        } catch (error) {
          console.error("Payment verification error:", error);

          toast.error(
            "Payment was submitted, but order confirmation failed. Check your orders before retrying.",
          );
        } finally {
          setLoading(false);
        }
      },

      modal: {
        ondismiss: () => {
          toast.info("Payment window closed");
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  // Place Order
  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (loading || applyingCoupon) return;

    if (!validateAddress()) return;

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }

    try {
      setLoading(true);

      if (paymentMethod === "COD") {
        await placeCODOrder();
      } else if (paymentMethod === "Razorpay") {
        await payWithRazorpay();
      }
    } catch (error) {
      console.error("Place order error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="checkout-page py-5">
      <div className="container">
        {/* Header */}
        <div className="checkout-header mb-4">
          <button
            className="btn btn-link text-decoration-none p-0 mb-3"
            type="button"
            onClick={() => navigate("/cart")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Cart
          </button>

          <h2 className="fw-bold mb-2">Checkout</h2>
          <p className="text-muted mb-0">Complete your purchase securely</p>
        </div>

        {/* Checkout Steps */}
        <div className="checkout-steps mb-4">
          <div className="checkout-step active">
            <span>1</span>
            <div>
              <small>Step 1</small>
              <strong>Delivery</strong>
            </div>
          </div>

          <div className="checkout-line"></div>

          <div className="checkout-step active">
            <span>2</span>
            <div>
              <small>Step 2</small>
              <strong>Payment</strong>
            </div>
          </div>

          <div className="checkout-line"></div>

          <div className="checkout-step">
            <span>3</span>
            <div>
              <small>Step 3</small>
              <strong>Confirmation</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="row g-4">
            {/* LEFT: Address and payment */}
            <div className="col-lg-8">
              {/* Shipping Address */}
              <div className="checkout-card mb-4">
                <div className="checkout-card-header">
                  <div className="checkout-icon">
                    <FontAwesomeIcon icon={faLocationDot} />
                  </div>

                  <div>
                    <h5 className="mb-1 fw-bold">Shipping Address</h5>
                    <p className="text-muted mb-0 small">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control checkout-input"
                      placeholder="Enter your full name"
                      name="fullName"
                      value={shippingAddress.fullName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="form-control checkout-input"
                      placeholder="Enter mobile number"
                      name="mobile"
                      value={shippingAddress.mobile}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">House No.</label>
                    <input
                      type="text"
                      className="form-control checkout-input"
                      placeholder="Enter house no."
                      name="houseNo"
                      value={shippingAddress.houseNo}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Street / Area</label>
                    <input
                      type="text"
                      className="form-control checkout-input"
                      placeholder="Enter street or area"
                      name="street"
                      value={shippingAddress.street}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control checkout-input"
                      placeholder="City"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control checkout-input"
                      placeholder="Enter your state"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      className="form-control checkout-input"
                      placeholder="Enter pincode"
                      name="pincode"
                      value={shippingAddress.pincode}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control checkout-input"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <div className="checkout-icon">
                    <FontAwesomeIcon icon={faCreditCard} />
                  </div>

                  <div>
                    <h5 className="mb-1 fw-bold">Payment Method</h5>
                    <p className="text-muted mb-0 small">
                      Choose your preferred payment option
                    </p>
                  </div>
                </div>

                {/* COD */}
                <div
                  className={`payment-option ${
                    paymentMethod === "COD" ? "selected" : ""
                  }`}
                >
                  <div className="form-check">
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      id="cod"
                      checked={paymentMethod === "COD"}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />

                    <label className="form-check-label" htmlFor="cod">
                      <div className="payment-content">
                        <div className="payment-method-icon cod-icon">
                          <FontAwesomeIcon icon={faMoneyBillWave} />
                        </div>

                        <div>
                          <h6 className="mb-1 fw-semibold">Cash on Delivery</h6>
                          <p className="text-muted small mb-0">
                            Pay when your order arrives
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Razorpay */}
                <div
                  className={`payment-option mt-3 ${
                    paymentMethod === "Razorpay" ? "selected" : ""
                  }`}
                >
                  <div className="form-check">
                    <input
                      type="radio"
                      name="payment"
                      value="Razorpay"
                      id="razorpay"
                      checked={paymentMethod === "Razorpay"}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />

                    <label className="form-check-label" htmlFor="razorpay">
                      <div className="payment-content">
                        <div className="payment-method-icon">
                          <FontAwesomeIcon icon={faCreditCard} />
                        </div>

                        <div>
                          <h6 className="mb-1 fw-semibold">Online Payment</h6>
                          <p className="text-muted small mb-0">
                            Pay securely using Razorpay
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Order summary */}
            <div className="col-lg-4">
              <div className="order-summary-card">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <FontAwesomeIcon icon={faBoxOpen} className="text-primary" />
                  <h5 className="fw-bold mb-0">Order Summary</h5>
                </div>

                {/* Coupon - fixed: no nested form */}
                <div className="mb-4">
                  <label
                    htmlFor="couponCode"
                    className="form-label fw-semibold"
                  >
                    Coupon Code
                  </label>

                  <div className="input-group">
                    <input
                      id="couponCode"
                      type="text"
                      className="form-control"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(event) =>
                        setCouponInput(event.target.value.toUpperCase())
                      }
                      disabled={
                        Boolean(appliedCoupon) || loading || applyingCoupon
                      }
                    />

                    {appliedCoupon ? (
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleRemoveCoupon}
                        disabled={loading || applyingCoupon}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={handleApplyCoupon}
                        disabled={loading || applyingCoupon}
                      >
                        {applyingCoupon ? "Applying..." : "Apply"}
                      </button>
                    )}
                  </div>

                  {appliedCoupon && (
                    <small className="text-success d-block mt-2">
                      Coupon {appliedCoupon} applied successfully
                    </small>
                  )}
                </div>

                {/* Cart Products */}
                {cartItems.map((item) => (
                  <div className="summary-product" key={item.product._id}>
                    <div className="summary-product-image">
                      <img
                        src={
                          item.product.images?.[0] ||
                          "https://placehold.co/80x80/f8f9fa/0d6efd?text=Product"
                        }
                        alt={item.product.name}
                      />
                    </div>

                    <div className="flex-grow-1">
                      <h6 className="fw-semibold mb-1">{item.product.name}</h6>
                      <small className="text-muted">
                        Quantity: {item.quantity}
                      </small>
                    </div>

                    <strong>
                      ₹
                      {(item.product.discountPrice || item.product.price) *
                        item.quantity}
                    </strong>
                  </div>
                ))}

                <hr />

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span>Product Discount</span>
                  <span className="text-success">-₹{discount.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="summary-row">
                    <span>Coupon ({appliedCoupon})</span>
                    <span className="text-success">
                      -₹{couponDiscount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Delivery</span>
                  <span className="text-success">Free</span>
                </div>

                <hr />

                <div className="summary-total">
                  <span>Total</span>
                  <strong>₹{total.toFixed(2)}</strong>
                </div>

                <button
                  type="submit"
                  disabled={loading || applyingCoupon}
                  className="btn btn-primary w-100 py-3 mt-4 fw-semibold"
                >
                  {loading ? "Please wait..." : "Place Order"}
                </button>

                <div className="secure-payment">
                  <FontAwesomeIcon icon={faLock} />
                  <span>Secure & encrypted payment</span>
                </div>

                <div className="delivery-info">
                  <FontAwesomeIcon icon={faTruckFast} />
                  <div>
                    <strong>Free Delivery</strong>
                    <small>Estimated delivery in 3–5 days</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Checkout;
