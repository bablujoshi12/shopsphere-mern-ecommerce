import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return children;
  }

  try {
    const decodedToken = jwtDecode(token);

    // Expired token
    if (decodedToken.exp && decodedToken.exp * 1000 <= Date.now()) {
      localStorage.removeItem("token");
      return children;
    }

    // Redirect according to role
    if (decodedToken.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/" replace />;
  } catch (error) {
    localStorage.removeItem("token");
    return children;
  }
}

export default PublicRoute;
