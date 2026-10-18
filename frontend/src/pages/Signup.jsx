import React, { useState } from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faPhone,
  faLock,
  faEye,
  faArrowRight,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL from "../config/api";

import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [signupInfo, setSignupInfo] = useState({
    username: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const fieldName = e.target.name;
    const inputValue = e.target.value;

    setSignupInfo((currVal) => {
      return {
        ...currVal,
        [fieldName]: inputValue,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { username, mobile, email, password, confirmPassword } = signupInfo;

    if (!username || !mobile || !email || !password || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobileRegex.test(mobile)) {
      toast.error("Enter a valid 10 digit mobile number");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("please enter the same password");
      return;
    }

    try {
      const url = `${BACKEND_URL}/auth/signup`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(signupInfo),
      });

      const result = await response.json();
      let { message, success } = result;
      if (success) {
        toast.success(message);
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } else {
        return toast.error(message);
      }
    } catch (err) {
      return toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="login-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="login-card signup-card">
              {/* Logo */}
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-1">ShopSphere</h2>

                <p className="text-muted mb-0">
                  Create your account and start shopping
                </p>
              </div>

              {/* Signup Form */}
              <form onSubmit={handleSubmit}>
                {/* Username + Phone */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Username</label>

                    <div className="login-input-wrapper">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="login-input-icon"
                      />

                      <input
                        type="text"
                        className="form-control login-input"
                        name="username"
                        value={signupInfo.username}
                        onChange={handleChange}
                        placeholder="Enter username"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Phone Number
                    </label>

                    <div className="login-input-wrapper">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="login-input-icon"
                      />

                      <input
                        type="tel"
                        className="form-control login-input"
                        name="mobile"
                        value={signupInfo.mobile}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-12">
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
                        value={signupInfo.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Password</label>

                    <div className="login-input-wrapper">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="login-input-icon"
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control login-input"
                        name="password"
                        value={signupInfo.password}
                        onChange={handleChange}
                        placeholder="Create password"
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        className="login-eye-btn"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Confirm Password
                    </label>

                    <div className="login-input-wrapper">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="login-input-icon"
                      />

                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-control login-input"
                        name="confirmPassword"
                        value={signupInfo.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        className="login-eye-btn"
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="form-check mt-4 mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="terms"
                  />

                  <label
                    className="form-check-label text-muted small"
                    htmlFor="terms"
                  >
                    I agree to the{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small"
                    >
                      Terms & Conditions
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>

                {/* Create Account */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold login-btn"
                >
                  Create Account
                  <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </button>
              </form>

              {/* Login */}
              <div className="text-center mt-4">
                <p className="text-muted mb-0">
                  Already have an account?
                  <button
                    type="button"
                    className="btn btn-link p-0 ms-1 text-decoration-none fw-semibold"
                    onClick={() => {
                      navigate("/login");
                    }}
                  >
                    Login
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

export default Signup;
