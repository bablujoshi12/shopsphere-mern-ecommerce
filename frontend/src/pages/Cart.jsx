import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faMinus,
  faPlus,
  faArrowLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";

import BACKEND_URL from "../config/api";
import { toast } from "react-toastify";

function Cart() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  const discount = cartItems.reduce(
    (total, item) =>
      total +
      (item.product.price -
        (item.product.discountPrice || item.product.price)) *
        item.quantity,
    0,
  );

  const total = subtotal - discount;

  const getItem = async () => {
    try {
      const url = `${BACKEND_URL}/cart`;

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

      setCartItems(result.cart.items);
    } catch (err) {
      toast.error("Bad request. Something went wrong");
    }
  };

  const increaseItem = (item) => {
    const productId = item.product._id;
    const quantity = item.quantity + 1;

    updateItem(productId, quantity);
  };

  const decreaseItem = (item) => {
    const productId = item.product._id;
    const quantity = item.quantity - 1;

    if (quantity < 1) {
      return;
    }

    updateItem(productId, quantity);
  };

  const updateItem = async (productId, quantity) => {
    try {
      const url = `${BACKEND_URL}/cart`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return toast.error(result.message);
      }

      setCartItems(result.cart.items);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteItem = async (productId) => {
    try {
      const url = `${BACKEND_URL}/cart`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          productId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return toast.error(result.message);
      }

      setCartItems(result.cart.items);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    getItem();
  }, []);

  return (
    <main className="py-5">
      <div className="container">
        {/* Heading */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1">Shopping Cart</h2>
          <p className="text-muted mb-0">Review your items before checkout.</p>
        </div>

        <div className="row g-4">
          {/* Cart Items */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-5">
                    <h5 className="fw-bold mb-2">Your cart is empty</h5>

                    <p className="text-muted mb-4">
                      Add some products to your cart.
                    </p>

                    <Link to="/products" className="btn btn-primary">
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <div
                        className="row align-items-center g-3 py-3 border-bottom"
                        key={item.product._id}
                      >
                        {/* Image */}
                        <div className="col-4 col-md-2">
                          <img
                            src={
                              item.product.images?.[0] ||
                              "https://placehold.co/100x100/f8f9fa/0d6efd?text=Product"
                            }
                            alt={item.product.name}
                            className="img-fluid rounded bg-light"
                          />
                        </div>

                        {/* Product */}
                        <div className="col-8 col-md-4">
                          <h6 className="fw-bold mb-1">{item.product.name}</h6>

                          <p className="text-muted small mb-0">
                            {item.product.description}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="col-6 col-md-2">
                          <span className="fw-semibold">
                            ₹{item.product.discountPrice || item.product.price}
                          </span>
                        </div>

                        {/* Quantity */}
                        <div className="col-6 col-md-3">
                          <div className="d-inline-flex align-items-center border rounded">
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => decreaseItem(item)}
                            >
                              <FontAwesomeIcon icon={faMinus} />
                            </button>

                            <span className="px-3 fw-semibold">
                              {item.quantity}
                            </span>

                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => increaseItem(item)}
                            >
                              <FontAwesomeIcon icon={faPlus} />
                            </button>
                          </div>
                        </div>

                        {/* Delete */}
                        <div className="col-12 col-md-1 text-md-end">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteItem(item.product._id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Continue Shopping */}
                    <div className="pt-4">
                      <Link to="/products" className="btn btn-outline-primary">
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Continue Shopping
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Order Summary</h5>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Discount</span>
                  <span className="text-success">-₹{discount || 0}</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Delivery</span>
                  <span className="text-success">Free</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-4">
                  <span className="fw-bold">Total</span>

                  <span className="fw-bold fs-5 text-primary">₹{total}</span>
                </div>

                <button
                  className="btn btn-primary w-100 py-2"
                  disabled={cartItems.length === 0}
                  onClick={() => {
                    navigate("/checkout");
                  }}
                >
                  Proceed to Checkout
                  <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Cart;
