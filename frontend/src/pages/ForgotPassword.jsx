import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faArrowRight,
  faArrowLeft,
  faShieldHalved,
  faKey,
} from "@fortawesome/free-solid-svg-icons";

function ForgotPassword() {
  return (
    <main className="forgot-password-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-7 col-lg-5">
            <div className="forgot-password-card">
              {/* Icon */}
              <div className="forgot-password-icon">
                <FontAwesomeIcon icon={faKey} />
              </div>

              {/* Heading */}
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">Forgot Password?</h2>

                <p className="text-muted mb-0">
                  Don't worry! Enter your email address and we'll send you a
                  link to reset your password.
                </p>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Email Address</label>

                <div className="forgot-input-wrapper">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="forgot-input-icon"
                  />

                  <input
                    type="email"
                    className="form-control forgot-input"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Button */}
              <button className="btn btn-primary w-100 py-2 fw-semibold forgot-submit-btn">
                Send Reset Link
                <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
              </button>

              {/* Back Login */}
              <div className="text-center mt-4">
                <button className="btn btn-link text-decoration-none p-0">
                  <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                  Back to Login
                </button>
              </div>

              {/* Security */}
              <div className="forgot-security">
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

export default ForgotPassword;
