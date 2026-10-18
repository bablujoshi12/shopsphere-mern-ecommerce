import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

function Newsletter() {
  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="bg-primary text-white rounded-4 p-4 p-md-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <h2 className="fw-bold mb-2">Stay Updated with ShopSphere</h2>

              <p className="mb-0 opacity-75">
                Subscribe to get the latest products, offers and updates.
              </p>
            </div>

            <div className="col-lg-6">
              <form className="d-flex gap-2">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </span>

                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                  />
                </div>

                <button type="submit" className="btn btn-light px-4">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
