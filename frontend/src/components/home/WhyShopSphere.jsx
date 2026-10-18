import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTruckFast,
  faShieldHalved,
  faRotateLeft,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";

function WhyShopSphere() {
  const features = [
    {
      icon: faTruckFast,
      title: "Fast Delivery",
      description: "Get your products delivered quickly to your doorstep.",
    },
    {
      icon: faShieldHalved,
      title: "Secure Shopping",
      description: "Your personal information and payments stay protected.",
    },
    {
      icon: faRotateLeft,
      title: "Easy Returns",
      description: "Simple and hassle-free returns on eligible products.",
    },
    {
      icon: faHeadset,
      title: "24/7 Support",
      description: "Our support team is always ready to help you.",
    },
  ];

  return (
    <section className="py-5">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold">Why ShopSphere?</h2>
          <p className="text-muted mb-0">
            Shopping made simple, secure and convenient.
          </p>
        </div>

        <div className="row g-4">
          {features.map((feature) => (
            <div className="col-12 col-sm-6 col-lg-3" key={feature.title}>
              <div className="text-center px-3">
                <div className="text-primary fs-1 mb-3">
                  <FontAwesomeIcon icon={feature.icon} />
                </div>

                <h5 className="fw-bold">{feature.title}</h5>

                <p className="text-muted mb-0">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyShopSphere;
