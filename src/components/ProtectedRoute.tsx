
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // If still loading auth state, show nothing or a loading spinner
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not logged in, redirect to landing page
  if (!user) {
    // Save the attempted URL for redirecting after successful login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If logged in, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
