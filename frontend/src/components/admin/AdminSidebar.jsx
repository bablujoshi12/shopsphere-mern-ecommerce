import React from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faBoxOpen,
  faCartShopping,
  faUsers,
  faTags,
  faLayerGroup,
  faStar,
  faImages,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const navItems = [
  { name: "Dashboard", icon: faGaugeHigh, path: "/admin" },
  { name: "Products", icon: faBoxOpen, path: "/admin/products" },
  { name: "Categories", icon: faLayerGroup, path: "/admin/categories" },
  { name: "Banners", icon: faImages, path: "/admin/banners" },
  { name: "Orders", icon: faCartShopping, path: "/admin/orders" },
  { name: "Users", icon: faUsers, path: "/admin/users" },
  { name: "Coupons", icon: faTags, path: "/admin/coupons" },
  { name: "Reviews", icon: faStar, path: "/admin/reviews" },
];

function AdminSidebar({ mobileMenuOpen, setMobileMenuOpen, navigate }) {
  const location = useLocation();

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        className={`admin-mobile-backdrop ${mobileMenuOpen ? "show" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        tabIndex={mobileMenuOpen ? 0 : -1}
      />

      <aside
        className={`bg-white border-end p-3 p-lg-4 flex-shrink-0 col-12 col-lg-2 overflow-auto admin-dashboard-sidebar ${
          mobileMenuOpen ? "mobile-menu-open" : ""
        }`}
      >
        <div className="d-flex justify-content-between align-items-start mb-3 mb-lg-4 px-1">
          <div>
            <h4 className="fw-bold mb-0">ShopSphere</h4>
            <small className="text-muted">Admin Panel</small>
          </div>

          <button
            type="button"
            className="btn btn-light d-lg-none"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav className="d-flex flex-column gap-2">
          {navItems.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);

            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`btn text-start d-inline-flex align-items-center gap-2 gap-lg-3 text-nowrap ${
                  isActive
                    ? "bg-primary-subtle text-primary fw-semibold"
                    : "btn-light text-secondary"
                }`}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default AdminSidebar;
