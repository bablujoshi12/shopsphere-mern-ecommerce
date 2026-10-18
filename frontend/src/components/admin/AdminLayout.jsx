import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        .admin-dashboard-shell { height: 100vh; overflow: hidden; }
        .admin-dashboard-layout { height: 100%; min-height: 0; }
        .admin-dashboard-sidebar {
          height: 100%; min-height: 0; overflow-y: auto;
          overscroll-behavior: contain;
        }
        .admin-dashboard-content {
          height: 100%; min-height: 0; overflow-y: auto;
          overscroll-behavior: contain;
        }
        .admin-mobile-backdrop { display: none; }
        @media (max-width: 991.98px) {
          .admin-dashboard-shell { height: auto; min-height: 100vh; overflow: visible; }
          .admin-dashboard-layout { height: auto; min-height: 100vh; }
          .admin-dashboard-sidebar {
            position: fixed; top: 0; bottom: 0; left: 0; z-index: 1055;
            width: min(82vw, 320px); max-width: 320px; height: 100dvh;
            min-height: 0; overflow-y: auto; border-right: 1px solid #dee2e6;
            box-shadow: 0 0.5rem 1.5rem rgba(0,0,0,.15);
            transform: translateX(-105%); transition: transform .25s ease-in-out;
            visibility: hidden;
          }
          .admin-dashboard-sidebar.mobile-menu-open {
            transform: translateX(0); visibility: visible;
          }
          .admin-mobile-backdrop.show {
            display: block; position: fixed; inset: 0; z-index: 1050;
            width: 100%; height: 100%; border: 0;
            background: rgba(15,23,42,.45);
          }
          .admin-dashboard-content {
            width: 100%; height: auto; min-height: 100vh; overflow: visible;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-dashboard-sidebar { transition: none; }
        }
      `}</style>
      <main className="bg-body-tertiary overflow-hidden admin-dashboard-shell">
        <div className="d-flex flex-column flex-lg-row admin-dashboard-layout">
          <AdminSidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} navigate={navigate} />
          <section className="flex-grow-1 w-100 col min-w-0 overflow-auto admin-dashboard-content">
            <div className="container-fluid p-3 p-md-4">
              <div className="d-flex align-items-start gap-3 mb-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-lg-none"
                  aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen((open) => !open)}
                >
                  <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} />
                </button>
                <div>
                  <h2 className="fw-bold mb-1">Admin Panel</h2>
                  <p className="text-muted mb-0">Manage your store</p>
                </div>
              </div>
              {children}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default AdminLayout;
