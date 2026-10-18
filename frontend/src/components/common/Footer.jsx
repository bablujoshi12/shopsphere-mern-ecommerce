import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faInstagram,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";

function Footer() {
  return (
    <footer className="bg-dark text-white pt-5">
      <div className="container">
        <div className="row g-4 pb-4">
          {/* Brand */}
          <div className="col-lg-4">
            <h4 className="fw-bold text-primary">ShopSphere</h4>

            <p className="text-secondary mt-3">
              Your trusted online shopping destination for quality products at
              great prices.
            </p>

            <div className="d-flex gap-3 mt-4">
              <a href="#" className="text-white">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>

              <a href="#" className="text-white">
                <FontAwesomeIcon icon={faInstagram} />
              </a>

              <a href="#" className="text-white">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-bold mb-3">Quick Links</h6>

            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-secondary text-decoration-none">
                  Home
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/products"
                  className="text-secondary text-decoration-none"
                >
                  Products
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/about"
                  className="text-secondary text-decoration-none"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="text-secondary text-decoration-none"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="col-6 col-lg-3">
            <h6 className="fw-bold mb-3">Customer Support</h6>

            <ul className="list-unstyled">
              <li className="mb-2 text-secondary">Help Center</li>
              <li className="mb-2 text-secondary">Shipping & Delivery</li>
              <li className="mb-2 text-secondary">Returns & Refunds</li>
              <li className="text-secondary">Privacy Policy</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-3">
            <h6 className="fw-bold mb-3">Contact Us</h6>

            <p className="text-secondary mb-2">bjbablujoshi@gmail.com</p>

            <p className="text-secondary mb-0">+91 8630444725</p>
          </div>
        </div>

        <hr className="border-secondary" />

        <div className="text-center py-3">
          <p className="text-secondary mb-0">
            © 2026 ShopSphere. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
