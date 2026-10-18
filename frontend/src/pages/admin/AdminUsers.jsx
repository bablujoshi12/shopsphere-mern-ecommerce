import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  faSearch,
  faEye,
  faPen,
  faBan,
  faChevronLeft,
  faChevronRight,
  faUser,
  faTimes,
  faUsers,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AdminLayout from "../../components/admin/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function AdminUsers() {
  const navigate = useNavigate();
  // Users aur pagination
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search aur filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  // Loading aur errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal
  const [modalType, setModalType] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Edit form
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [userRole, setUserRole] = useState("customer");

  // API headers
  const getHeaders = () => ({
    Authorization: localStorage.getItem("token"),
    "Content-Type": "application/json",
  });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        search,
        role,
        status,
        page: String(page),
        limit: "10",
      });

      const response = await fetch(`${API_URL}/api/users/admin/all?${params}`, {
        headers: getHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Users fetch nahi hue");
      }

      setUsers(result.users || []);
      setTotalUsers(result.pagination.totalUsers);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, role, status, page]);

  // Open modal
  const openModal = (type, user) => {
    setModalType(type);
    setSelectedUser(user);
    setModalError("");
    setModalMessage("");

    setUsername(user.username || "");
    setEmail(user.email || "");
    setMobile(user.mobile || "");
    setUserRole(user.role || "customer");
  };

  // Close modal
  const closeModal = () => {
    if (modalLoading) return;

    setModalType("");
    setSelectedUser(null);
    setModalError("");
    setModalMessage("");
  };

  // Edit user
  const handleEditUser = async (event) => {
    event.preventDefault();

    if (!selectedUser) return;

    setModalLoading(true);
    setModalError("");
    setModalMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/users/admin/${selectedUser._id}`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            username,
            email,
            mobile,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "User update failed");
      }

      // Role update only when changed
      if (userRole !== selectedUser.role) {
        const roleResponse = await fetch(
          `${API_URL}/api/users/admin/${selectedUser._id}/role`,
          {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({ role: userRole }),
          },
        );

        const roleResult = await roleResponse.json();

        if (!roleResponse.ok) {
          throw new Error(roleResult.message || "Role update failed");
        }
      }

      setModalMessage("User details updated successfully!");

      await fetchUsers();
    } catch (err) {
      setModalError(err.message || "User update failed");
      await fetchUsers();
    } finally {
      setModalLoading(false);
    }
  };

  // Block / unblock user
  const handleBlockUser = async () => {
    if (!selectedUser || selectedUser.role === "admin") return;

    setModalLoading(true);
    setModalError("");
    setModalMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/users/admin/${selectedUser._id}/block`,
        {
          method: "PATCH",
          headers: getHeaders(),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Status update nahi hua");
      }

      setSelectedUser(result.user);
      setModalMessage(result.message || "User status update ho gaya!");

      await fetchUsers();
    } catch (err) {
      setModalError(err.message || "Status update failed");
    } finally {
      setModalLoading(false);
    }
  };

  // Date format
  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Role badge
  const roleBadge = (user) => (
    <span
      className={`badge ${
        user.role === "admin"
          ? "bg-primary-subtle text-primary"
          : "bg-light text-dark border"
      }`}
    >
      {user.role === "admin" ? "Admin" : "Customer"}
    </span>
  );

  // Status badge
  const statusBadge = (user) => (
    <span
      className={`badge ${
        user.isBlocked
          ? "bg-danger-subtle text-danger"
          : "bg-success-subtle text-success"
      }`}
    >
      {user.isBlocked ? "Blocked" : "Active"}
    </span>
  );

  // User avatar
  const userAvatar = (size = 46) => (
    <div
      className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size > 42 ? 18 : 16,
      }}
    >
      <FontAwesomeIcon icon={faUser} />
    </div>
  );

  // Action buttons
  const renderActions = (user, withLabels = false) => (
    <>
      <button
        type="button"
        className={`btn btn-sm btn-outline-primary ${
          withLabels ? "flex-fill" : "me-2"
        }`}
        title="View User"
        onClick={() => openModal("view", user)}
      >
        <FontAwesomeIcon icon={faEye} />
        {withLabels && <span className="ms-1">View</span>}
      </button>

      <button
        type="button"
        className={`btn btn-sm btn-outline-success ${
          withLabels ? "flex-fill" : "me-2"
        }`}
        title="Edit User"
        onClick={() => openModal("edit", user)}
      >
        <FontAwesomeIcon icon={faPen} />
        {withLabels && <span className="ms-1">Edit</span>}
      </button>

      <button
        type="button"
        className={`btn btn-sm ${
          user.isBlocked ? "btn-outline-success" : "btn-outline-danger"
        } ${withLabels ? "flex-fill" : ""}`}
        title={user.isBlocked ? "Unblock User" : "Block User"}
        disabled={user.role === "admin"}
        onClick={() => openModal("block", user)}
      >
        <FontAwesomeIcon icon={faBan} />
        {withLabels && (
          <span className="ms-1">{user.isBlocked ? "Unblock" : "Block"}</span>
        )}
      </button>
    </>
  );

  // User card: mobile and tablet
  const renderUserCard = (user) => (
    <div className="col-12 col-md-6" key={user._id}>
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body p-3 p-sm-4">
          {/* User information */}
          <div className="d-flex align-items-start gap-3 mb-3">
            {userAvatar(48)}

            <div className="flex-grow-1 overflow-hidden">
              <h6 className="fw-bold mb-1 text-break">{user.username}</h6>

              <div className="text-muted small text-break">{user.email}</div>

              <div className="text-muted small mt-1">
                {user.mobile || "No phone number"}
              </div>
            </div>
          </div>

          {/* Role and status */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            {roleBadge(user)}
            {statusBadge(user)}
          </div>

          {/* User details */}
          <div className="row g-2">
            <div className="col-6">
              <div className="bg-light rounded p-2 h-100">
                <small className="text-muted d-block mb-1">Joined</small>
                <span className="small fw-semibold">
                  {formatDate(user.createdAt)}
                </span>
              </div>
            </div>

            <div className="col-6">
              <div className="bg-light rounded p-2 h-100">
                <small className="text-muted d-block mb-1">
                  Email verified
                </small>
                <span className="small fw-semibold">
                  {user.isEmailVerified ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <hr className="my-3" />

          {/* Actions */}
          <div className="d-flex gap-2">{renderActions(user, true)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="container-fluid px-2 px-sm-3 px-lg-4 pt-3 pt-md-4 pb-3">
        {/* Page header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Users</h2>
            <p className="text-muted mb-0">
              Manage registered users and their accounts
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 rounded bg-primary bg-opacity-10 text-primary px-3 py-2">
            <FontAwesomeIcon icon={faUsers} />
            <span className="fw-semibold">{totalUsers} Total Users</span>
          </div>
        </div>

        {/* Search and filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3">
            <div className="row g-2">
              <div className="col-12 col-lg">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>

                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search username, email or phone..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                  />

                  {search && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setSearch("");
                        setPage(1);
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      <span className="ms-1">Clear</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-6 col-lg-2">
                <select
                  className="form-select"
                  aria-label="Filter by role"
                  value={role}
                  onChange={(event) => {
                    setRole(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="col-6 col-lg-2">
                <select
                  className="form-select"
                  aria-label="Filter by status"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="alert alert-danger d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
            <span>{error}</span>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={fetchUsers}
            >
              Retry
            </button>
          </div>
        )}

        {/* Users */}
        <div className="card border-0 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="d-none d-lg-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="p-3">User</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-end p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading &&
                    users.map((user) => (
                      <tr key={user._id}>
                        <td className="p-3">
                          <div className="d-flex align-items-center gap-2">
                            {userAvatar(42)}

                            <div>
                              <div className="fw-semibold">{user.username}</div>
                              <small className="text-muted">{user.email}</small>
                            </div>
                          </div>
                        </td>

                        <td>{user.mobile || "—"}</td>
                        <td>{roleBadge(user)}</td>
                        <td>{statusBadge(user)}</td>
                        <td>{formatDate(user.createdAt)}</td>

                        <td className="text-end p-3 text-nowrap">
                          {renderActions(user)}
                        </td>
                      </tr>
                    ))}

                  {loading && (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="spinner-border text-primary" />
                        <p className="text-muted mt-2 mb-0">Loading users...</p>
                      </td>
                    </tr>
                  )}

                  {!loading && users.length === 0 && !error && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-5">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile and tablet cards */}
          <div className="d-lg-none p-2 p-sm-3">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
                <p className="text-muted mt-2 mb-0">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-muted py-5">
                <FontAwesomeIcon icon={faUsers} size="2x" className="mb-3" />
                <p className="mb-0">No users found.</p>
              </div>
            ) : (
              <div className="row g-3">{users.map(renderUserCard)}</div>
            )}
          </div>

          {/* Pagination */}
          <div className="card-footer bg-white p-3">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <small className="text-muted">
                Showing {totalUsers === 0 ? 0 : (page - 1) * 10 + 1}
                {"–"}
                {Math.min(page * 10, totalUsers)}
                {" of "}
                {totalUsers} users
              </small>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  aria-label="Previous page"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((previous) => previous - 1)}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <span className="small text-nowrap">
                  Page {page} of {Math.max(totalPages, 1)}
                </span>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  aria-label="Next page"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((previous) => previous + 1)}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User modal */}
        {modalType && selectedUser && (
          <>
            <div className="modal-backdrop fade show" />

            <div
              className="modal fade show d-block"
              tabIndex="-1"
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
                <div className="modal-content border-0 shadow">
                  {/* Modal header */}
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">
                      {modalType === "view" && "User Details"}
                      {modalType === "edit" && "Edit User"}
                      {modalType === "block" &&
                        (selectedUser.isBlocked
                          ? "Unblock User"
                          : "Block User")}
                    </h5>

                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={closeModal}
                      disabled={modalLoading}
                    />
                  </div>

                  {/* Modal body */}
                  <div className="modal-body">
                    {modalError && (
                      <div className="alert alert-danger" role="alert">
                        {modalError}
                      </div>
                    )}

                    {modalMessage && (
                      <div className="alert alert-success" role="status">
                        {modalMessage}
                      </div>
                    )}

                    {/* View user */}
                    {modalType === "view" && (
                      <>
                        <div className="text-center mb-4">
                          {userAvatar(65)}

                          <div className="mt-3">
                            <h5 className="fw-bold mb-1 text-break">
                              {selectedUser.username}
                            </h5>
                            <p className="text-muted mb-0 text-break">
                              {selectedUser.email}
                            </p>
                          </div>

                          <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
                            {roleBadge(selectedUser)}
                            {statusBadge(selectedUser)}
                          </div>
                        </div>

                        <div className="list-group list-group-flush">
                          <div className="list-group-item d-flex justify-content-between gap-3">
                            <span className="text-muted">Mobile</span>
                            <strong className="text-end text-break">
                              {selectedUser.mobile || "—"}
                            </strong>
                          </div>

                          <div className="list-group-item d-flex justify-content-between gap-3">
                            <span className="text-muted">Role</span>
                            <strong className="text-capitalize">
                              {selectedUser.role}
                            </strong>
                          </div>

                          <div className="list-group-item d-flex justify-content-between gap-3">
                            <span className="text-muted">Status</span>
                            <strong>
                              {selectedUser.isBlocked ? "Blocked" : "Active"}
                            </strong>
                          </div>

                          <div className="list-group-item d-flex justify-content-between gap-3">
                            <span className="text-muted">Email verified</span>
                            <strong>
                              {selectedUser.isEmailVerified ? "Yes" : "No"}
                            </strong>
                          </div>

                          <div className="list-group-item d-flex justify-content-between gap-3">
                            <span className="text-muted">Joined</span>
                            <strong>
                              {formatDate(selectedUser.createdAt)}
                            </strong>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Edit user */}
                    {modalType === "edit" && (
                      <form id="editUserForm" onSubmit={handleEditUser}>
                        <div className="mb-3">
                          <label className="form-label" htmlFor="editUsername">
                            Username
                          </label>
                          <input
                            id="editUsername"
                            className="form-control"
                            value={username}
                            onChange={(event) =>
                              setUsername(event.target.value)
                            }
                            required
                            disabled={modalLoading}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label" htmlFor="editEmail">
                            Email
                          </label>
                          <input
                            id="editEmail"
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            disabled={modalLoading}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label" htmlFor="editMobile">
                            Mobile
                          </label>
                          <input
                            id="editMobile"
                            type="tel"
                            className="form-control"
                            value={mobile}
                            onChange={(event) => setMobile(event.target.value)}
                            required
                            disabled={modalLoading}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label" htmlFor="editRole">
                            User Role
                          </label>

                          <select
                            id="editRole"
                            className="form-select"
                            value={userRole}
                            onChange={(event) =>
                              setUserRole(event.target.value)
                            }
                            disabled={modalLoading}
                          >
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                          </select>

                          <small className="text-muted">
                            Role change karne se user ke permissions change
                            honge.
                          </small>
                        </div>
                      </form>
                    )}

                    {/* Block confirmation */}
                    {modalType === "block" && (
                      <div className="text-center py-3">
                        <div className="text-danger mb-3 fs-1">
                          <FontAwesomeIcon icon={faBan} />
                        </div>

                        <h5 className="fw-bold">
                          {selectedUser.isBlocked
                            ? "Unblock this user?"
                            : "Block this user?"}
                        </h5>

                        <p className="text-muted">
                          Are you sure you want to{" "}
                          {selectedUser.isBlocked ? "unblock" : "block"}{" "}
                          <strong className="text-break">
                            {selectedUser.username}
                          </strong>
                          ?
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modal footer */}
                  <div className="modal-footer d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-light border"
                      onClick={closeModal}
                      disabled={modalLoading}
                    >
                      Close
                    </button>

                    {modalType === "edit" && (
                      <button
                        type="submit"
                        form="editUserForm"
                        className="btn btn-primary"
                        disabled={modalLoading}
                      >
                        {modalLoading ? "Saving..." : "Save Changes"}
                      </button>
                    )}

                    {modalType === "block" && (
                      <button
                        type="button"
                        className={`btn ${
                          selectedUser.isBlocked ? "btn-success" : "btn-danger"
                        }`}
                        onClick={handleBlockUser}
                        disabled={modalLoading}
                      >
                        {modalLoading
                          ? "Please wait..."
                          : selectedUser.isBlocked
                            ? "Unblock User"
                            : "Block User"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminUsers;
