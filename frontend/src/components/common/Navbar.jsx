import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faCartShopping,
  faUser,
  faCircleUser,
  faHouse,
  faBagShopping,
  faXmark,
  faBars,
  faHeart,
  faBox,
  faRightToBracket,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();

    const searchValue = search.trim();

    if (!searchValue) return;

    closeMenu();
    navigate(`/products?search=${encodeURIComponent(searchValue)}`);
  };

  const desktopLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? "text-primary fw-bold" : "text-dark"}`;

  const mobileLinkClass = ({ isActive }) =>
    `btn text-secondary text-start d-inline-flex align-items-center gap-3 ${
      isActive ? "bg-primary-subtle text-primary fw-semibold" : "btn-light"
    }`;

  return (
    <>
      {/* Main Navbar */}
      <nav className="navbar bg-white border-bottom py-3 sticky-top">
        <div className="container">
          <Link
            className="navbar-brand fw-bold text-primary fs-4 mb-0"
            to="/"
            onClick={closeMenu}
          >
            ShopSphere
          </Link>

          {/* Desktop Navigation */}
          <div className="d-none d-lg-flex align-items-center flex-grow-1">
            <ul className="navbar-nav mx-auto flex-row gap-4">
              <li className="nav-item">
                <NavLink to="/" end className={desktopLinkClass}>
                  Home
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink to="/products" className={desktopLinkClass}>
                  Products
                </NavLink>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              <form className="d-flex" onSubmit={handleSearch} role="search">
                <input
                  className="form-control me-2"
                  type="search"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search products"
                />

                <button
                  className="btn btn-outline-primary"
                  type="submit"
                  aria-label="Search"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
              </form>

              {token ? (
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `btn text-nowrap ${
                      isActive ? "btn-primary" : "btn-outline-primary"
                    }`
                  }
                >
                  <FontAwesomeIcon icon={faCircleUser} className="me-2" />
                  Profile
                </NavLink>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `btn ${isActive ? "btn-primary" : "btn-outline-primary"}`
                  }
                >
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Login
                </NavLink>
              )}

              {/* Desktop Wishlist */}
              {token && (
                <NavLink
                  to="/wishlist"
                  className={({ isActive }) =>
                    `btn text-nowrap ${
                      isActive ? "btn-primary" : "btn-outline-primary"
                    }`
                  }
                >
                  <FontAwesomeIcon icon={faHeart} className="me-2" />
                  Wishlist
                </NavLink>
              )}

              {/* Desktop Cart */}
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `btn text-nowrap ${
                    isActive ? "btn-primary" : "btn-outline-primary"
                  }`
                }
              >
                <FontAwesomeIcon icon={faCartShopping} className="me-2" />
                Cart
              </NavLink>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="btn btn-light border d-lg-none"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>
        </div>
      </nav>

      {/* Mobile Backdrop */}
      <button
        type="button"
        aria-label="Close navigation menu"
        className="position-fixed top-0 start-0 w-100 h-100 border-0 d-lg-none"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 1050,
          display: mobileMenuOpen ? "block" : "none",
        }}
        onClick={closeMenu}
        tabIndex={mobileMenuOpen ? 0 : -1}
      />

      {/* Mobile Sidebar */}
      <aside
        className="bg-white border-end p-3 flex-shrink-0 overflow-auto position-fixed top-0 start-0 d-lg-none"
        style={{
          width: "min(280px, 78vw)",
          height: "100dvh",
          zIndex: 1051,
          transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          visibility: mobileMenuOpen ? "visible" : "hidden",
        }}
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        {/* Sidebar Header */}
        <div className="d-flex justify-content-between align-items-start mb-3 px-1">
          <div>
            <h4 className="fw-bold mb-0">ShopSphere</h4>
            <small className="text-muted">Your Store</small>
          </div>

          <button
            type="button"
            className="btn btn-light"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <hr />

        {/* Mobile Search */}
        <form className="mb-4" onSubmit={handleSearch} role="search">
          <label className="form-label small fw-semibold">
            Search Products
          </label>

          <div className="input-group">
            <input
              className="form-control"
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />

            <button
              className="btn btn-outline-primary"
              type="submit"
              aria-label="Search"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
          </div>
        </form>

        {/* Main Navigation */}
        <p className="text-muted small fw-semibold text-uppercase mb-2 px-1">
          Shop
        </p>

        <nav className="d-flex flex-column gap-2">
          <NavLink to="/" end className={mobileLinkClass} onClick={closeMenu}>
            <FontAwesomeIcon icon={faHouse} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/products"
            className={mobileLinkClass}
            onClick={closeMenu}
          >
            <FontAwesomeIcon icon={faBagShopping} />
            <span>Products</span>
          </NavLink>

          {token && (
            <>
              <NavLink
                to="/wishlist"
                className={mobileLinkClass}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faHeart} />
                <span>Wishlist</span>
              </NavLink>

              <NavLink
                to="/cart"
                className={mobileLinkClass}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faCartShopping} />
                <span>Cart</span>
              </NavLink>
            </>
          )}
        </nav>

        <hr className="my-4" />

        {/* Account Navigation */}
        <p className="text-muted small fw-semibold text-uppercase mb-2 px-1">
          My Account
        </p>

        <nav className="d-flex flex-column gap-2">
          {token ? (
            <>
              <NavLink
                to="/profile"
                className={mobileLinkClass}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faCircleUser} />
                <span>My Profile</span>
              </NavLink>

              <NavLink
                to="/orders"
                className={mobileLinkClass}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faBox} />
                <span>My Orders</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={mobileLinkClass}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faRightToBracket} />
                <span>Login</span>
              </NavLink>

              <NavLink
                to="/signup"
                className={mobileLinkClass}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faUserPlus} />
                <span>Create Account</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Navbar;
