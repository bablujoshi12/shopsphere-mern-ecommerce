import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faArrowRight,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL from "../config/api";

function Login() {
  const navigate = useNavigate();

  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setLoginInfo((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = loginInfo;

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginInfo),
      });

      const result = await response.json();

      const { message, success, token, username, email: userEmail } = result;

      if (!response.ok || !success || !token) {
        toast.error(message || "Login failed. Please try again.");
        return;
      }

      // Save login details
      localStorage.setItem("token", token);
      localStorage.setItem("username", username || "");
      localStorage.setItem("email", userEmail || "");

      // Decode JWT to identify user role
      let decodedToken;

      try {
        decodedToken = jwtDecode(token);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("email");

        toast.error("Invalid login token. Please try again.");
        return;
      }

      // Check token expiration
      if (decodedToken.exp && decodedToken.exp * 1000 <= Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("email");

        toast.error("Your session has expired. Please login again.");
        return;
      }

      toast.success(message || "Login successful!");

      // Redirect according to user role
      setTimeout(() => {
        if (decodedToken.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 1000);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="login-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-7 col-lg-5">
            <div className="login-card">
              {/* Logo */}
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-1">ShopSphere</h2>

                <p className="text-muted mb-0">
                  Welcome back! Please login to your account.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Email Address
                  </label>

                  <div className="login-input-wrapper">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="login-input-icon"
                    />

                    <input
                      type="email"
                      className="form-control login-input"
                      name="email"
                      value={loginInfo.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label fw-semibold">Password</label>

                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="login-input-wrapper">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="login-input-icon"
                    />

                    <input
                      type="password"
                      className="form-control login-input"
                      name="password"
                      value={loginInfo.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />

                    <button
                      type="button"
                      className="login-eye-btn"
                      aria-label="Password visibility"
                      onClick={(e) => {
                        const input =
                          e.currentTarget.parentElement.querySelector(
                            'input[name="password"]',
                          );

                        if (input) {
                          input.type =
                            input.type === "password" ? "text" : "password";
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="form-check mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                  />

                  <label
                    className="form-check-label text-muted"
                    htmlFor="rememberMe"
                  >
                    Remember me
                  </label>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold login-btn"
                >
                  Login
                  <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </button>
              </form>

              {/* Divider */}
              <div className="login-divider">
                <span>OR</span>
              </div>

              {/* Signup */}
              <div className="text-center">
                <p className="text-muted mb-0">
                  Don't have an account?
                  <button
                    type="button"
                    className="btn btn-link p-0 ms-1 text-decoration-none fw-semibold"
                    onClick={() => navigate("/signup")}
                  >
                    Create Account
                  </button>
                </p>
              </div>

              {/* Security */}
              <div className="login-security">
                <FontAwesomeIcon icon={faShieldHalved} />

                <span>Your information is secure and protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
