import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import useCartStore from "../../store/useCartStore";

/**
 * Header with brand, primary nav, and auth controls.
 * Reflects authentication and role state, and exposes quick links.
 */

// PUBLIC_INTERFACE
export default function Header() {
  /** Top navigation bar with auth-aware actions. */
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const { items } = useCartStore();
  const cartCount = items?.length || 0;

  const onSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <header
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
      aria-label="Primary navigation"
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/" className="link" style={{ fontWeight: 800, fontSize: 18, textDecoration: "none" }}>
            Digital T3 LMS
          </Link>

          <nav aria-label="Main">
            <ul style={{ display: "flex", listStyle: "none", padding: 0, margin: 0, gap: 10 }}>
              <li>
                <NavLink to="/courses" className="link">
                  Courses
                </NavLink>
              </li>
              <li style={{ position: "relative" }}>
                <NavLink to="/cart" className="link">
                  Cart
                </NavLink>
                {cartCount > 0 && (
                  <span
                    aria-label={`${cartCount} items in cart`}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -12,
                      background: "#EF4444",
                      color: "#fff",
                      borderRadius: 999,
                      padding: "2px 6px",
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </li>
              {/* Quick links to dashboards if role present */}
              {user && profile?.role === "student" && (
                <li>
                  <NavLink to="/student/dashboard" className="link">
                    Student
                  </NavLink>
                </li>
              )}
              {user && profile?.role === "instructor" && (
                <li>
                  <NavLink to="/instructor/dashboard" className="link">
                    Instructor
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!user ? (
            <>
              <Link className="btn" to="/login">
                Login
              </Link>
              <Link className="btn" to="/register">
                Register
              </Link>
            </>
          ) : (
            <>
              <span style={{ fontSize: 14, color: "#6b7280" }}>
                {profile?.full_name ? `Hi, ${profile.full_name}` : user.email}
              </span>
              <button className="btn" onClick={onSignOut}>Sign Out</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
