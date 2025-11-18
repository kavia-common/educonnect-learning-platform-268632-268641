import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

/**
 * Restricts access to users with a specific role.
 * Example roles: 'student' | 'instructor' | 'admin'
 */

// PUBLIC_INTERFACE
export default function RequireRole({ role, children, fallback = "/login" }) {
  /** Render children if current user's profile role matches; otherwise redirect. */
  const { profile, status } = useAuthStore();

  if (status === "loading") {
    return <div className="container">Loading...</div>;
  }

  if (!profile || (role && profile.role !== role)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
