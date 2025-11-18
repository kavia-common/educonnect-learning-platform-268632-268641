import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "../../store/useAuthStore";

/**
 * Protects child routes by requiring authentication.
 * Redirects to /login if unauthenticated.
 */

// PUBLIC_INTERFACE
export default function ProtectedRoute({ children }) {
  /** Wrap a route element to ensure user is authenticated. */
  const location = useLocation();
  const { user, status, initialize } = useAuthStore();

  useEffect(() => {
    if (status === "idle") {
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return <div className="container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
