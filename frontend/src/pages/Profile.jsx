import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPen,
  faEnvelope,
  faPhone,
  faLock,
  faBoxOpen,
  faHeart,
  faRightFromBracket,
  faCheck,
  faXmark,
  faCamera,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL from "../config/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [getMe, setGetMe] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  const [profileInfo, setProfileInfo] = useState({
    username: "",
    mobile: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const currentUser = getMe?.currentUser;

  // Get Profile
  const getProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: token,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to load profile");
        return;
      }

      setGetMe(result);

      setProfileInfo({
        username: result.currentUser.username || "",
        mobile: result.currentUser.mobile || "",
      });
    } catch (error) {
      toast.error("Unable to load your profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  // Cleanup preview URL when replaced or component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Handle Input Change
  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfileInfo((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Select Profile Image
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      event.target.value = "";
      return;
    }

    // 5 MB maximum
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setEditMode(true);
  };

  // Edit Profile
  const handleEdit = () => {
    setProfileInfo({
      username: currentUser?.username || "",
      mobile: currentUser?.mobile || "",
    });

    setSelectedImage(null);
    setImagePreview("");
    setEditMode(true);
  };

  // Cancel Edit
  const handleCancel = () => {
    setProfileInfo({
      username: currentUser?.username || "",
      mobile: currentUser?.mobile || "",
    });

    setSelectedImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setEditMode(false);
  };

  // Update Profile
  const handleUpdate = async () => {
    const username = profileInfo.username.trim();
    const mobile = profileInfo.mobile.trim();

    if (!username || !mobile) {
      toast.error("Username and mobile are required");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("mobile", mobile);

    if (selectedImage) {
      formData.append("profileImage", selectedImage);
    }

    setSaving(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        method: "PUT",
        headers: {
          Authorization: localStorage.getItem("token"),
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to update profile");
        return;
      }

      setGetMe((previous) => ({
        ...previous,
        currentUser: result.currentUser,
      }));

      setProfileInfo({
        username: result.currentUser.username || "",
        mobile: result.currentUser.mobile || "",
      });

      localStorage.setItem("username", result.currentUser.username || "");

      setSelectedImage(null);
      setImagePreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setEditMode(false);

      toast.success(result.message || "Profile updated successfully");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Profile Image
  const handleDeleteImage = async () => {
    if (!currentUser?.profileImage || deletingImage || saving) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your profile image?",
    );

    if (!confirmed) return;

    setDeletingImage(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me/profile-image`, {
        method: "DELETE",
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to delete profile image");
        return;
      }

      setGetMe((previous) => ({
        ...previous,
        currentUser: result.currentUser,
      }));

      setSelectedImage(null);
      setImagePreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success(result.message || "Profile image deleted successfully");
    } catch (error) {
      toast.error("Unable to delete profile image");
    } finally {
      setDeletingImage(false);
    }
  };

  if (loading) {
    return (
      <main className="profile-page py-5">
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3 mb-0">Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="profile-page py-5">
        <div className="container text-center py-5">
          <h4 className="fw-bold">Unable to load profile</h4>
          <p className="text-muted">
            Please log in again to view your profile.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  const displayedImage = imagePreview || currentUser.profileImage;

  return (
    <main className="profile-page py-5">
      <div className="container">
        {/* Page Header */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1">My Profile</h2>
          <p className="text-muted mb-0">
            Manage your account and personal information
          </p>
        </div>

        <div className="row g-4">
          {/* LEFT SIDEBAR */}
          <div className="col-lg-4">
            <div className="profile-sidebar">
              <div className="text-center">
                {/* Profile Image */}
                <div className="position-relative d-inline-block mb-3">
                  <div className="profile-avatar overflow-hidden">
                    {displayedImage ? (
                      <img
                        src={displayedImage}
                        alt="Profile"
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <FontAwesomeIcon icon={faUser} />
                    )}
                  </div>

                  {editMode && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0"
                        title="Choose profile image"
                        aria-label="Choose profile image"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving || deletingImage}
                      >
                        <FontAwesomeIcon icon={faCamera} />
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={handleImageChange}
                        disabled={saving || deletingImage}
                      />
                    </>
                  )}
                </div>

                <h4 className="fw-bold mb-1">{currentUser.username}</h4>
                <p className="text-muted mb-3">{currentUser.email}</p>

                <div className="d-flex justify-content-center flex-wrap gap-2">
                  {!editMode ? (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleEdit}
                    >
                      <FontAwesomeIcon icon={faPen} className="me-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleCancel}
                        disabled={saving || deletingImage}
                      >
                        <FontAwesomeIcon icon={faXmark} className="me-2" />
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleUpdate}
                        disabled={saving || deletingImage}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {editMode && (
                  <div className="mt-3">
                    <p className="small text-muted mb-2">
                      Choose an image up to 5 MB.
                    </p>

                    {selectedImage && (
                      <p className="small text-break mb-2">
                        Selected: {selectedImage.name}
                      </p>
                    )}

                    {currentUser.profileImage && !selectedImage && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleDeleteImage}
                        disabled={saving || deletingImage}
                      >
                        {deletingImage ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faTrash} className="me-2" />
                            Remove Profile Image
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <hr className="my-4" />

              {/* Sidebar Menu */}
              <div className="profile-menu">
                <button type="button" className="profile-menu-item active">
                  <FontAwesomeIcon icon={faUser} />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => navigate("/orders")}
                >
                  <FontAwesomeIcon icon={faBoxOpen} />
                  <span>My Orders</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => navigate("/wishlist")}
                >
                  <FontAwesomeIcon icon={faHeart} />
                  <span>Wishlist</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item logout-item"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faRightFromBracket} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="col-lg-8">
            {/* Personal Information */}
            <div className="profile-card mb-4">
              <div className="profile-card-header">
                <div>
                  <h5 className="fw-bold mb-1">Personal Information</h5>
                  <p className="text-muted small mb-0">
                    Update your username and mobile number
                  </p>
                </div>
              </div>

              <div className="row g-4 mt-1">
                {/* Username */}
                <div className="col-md-6">
                  <label className="profile-label">Username</label>

                  {editMode ? (
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      value={profileInfo.username}
                      onChange={handleChange}
                      maxLength={50}
                      required
                      disabled={saving}
                    />
                  ) : (
                    <div className="profile-info">
                      <FontAwesomeIcon icon={faUser} />
                      <span>{currentUser.username}</span>
                    </div>
                  )}
                </div>

                {/* Email - Read Only */}
                <div className="col-md-6">
                  <label className="profile-label">Email Address</label>

                  <div className="profile-info">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <span className="text-break">{currentUser.email}</span>
                  </div>

                  <small className="text-muted">
                    Email cannot be changed here.
                  </small>
                </div>

                {/* Mobile */}
                <div className="col-md-6">
                  <label className="profile-label">Mobile Number</label>

                  {editMode ? (
                    <input
                      type="tel"
                      name="mobile"
                      className="form-control"
                      value={profileInfo.mobile}
                      onChange={handleChange}
                      required
                      disabled={saving}
                    />
                  ) : (
                    <div className="profile-info">
                      <FontAwesomeIcon icon={faPhone} />
                      <span>{currentUser.mobile}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h5 className="fw-bold mb-1">Account Security</h5>
                  <p className="text-muted small mb-0">
                    Your account verification status
                  </p>
                </div>
              </div>

              <div className="security-row">
                <div className="security-icon">
                  <FontAwesomeIcon icon={faLock} />
                </div>

                <div className="flex-grow-1">
                  <h6 className="fw-semibold mb-1">Email Verification</h6>
                  <p className="text-muted small mb-0">
                    {currentUser.isEmailVerified
                      ? "Your email address is verified."
                      : "Your email address is not verified yet."}
                  </p>
                </div>

                <span
                  className={`badge ${
                    currentUser.isEmailVerified
                      ? "bg-success-subtle text-success"
                      : "bg-warning-subtle text-dark"
                  }`}
                >
                  {currentUser.isEmailVerified ? "Verified" : "Not verified"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;
