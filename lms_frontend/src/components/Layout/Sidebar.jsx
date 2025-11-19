import { NavLink } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import useCartStore from "../../store/useCartStore";

/**
 * Sidebar with navigation links for student and instructor areas.
 * Only shows sections relevant to the current user role.
 */

// PUBLIC_INTERFACE
export default function Sidebar() {
  /** Role-aware sidebar links for dashboards and settings. */
  const { user, profile } = useAuthStore();
  const role = profile?.role;
  const { items } = useCartStore();
  const cartCount = items?.length || 0;

  const linkStyle = ({ isActive }) => ({
    display: "block",
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: isActive ? "#fff" : "var(--text)",
    background: isActive ? "var(--color-primary)" : "transparent",
    transition: "var(--transition)",
  });

  return (
    <aside
      aria-label="Secondary navigation"
      style={{
        width: 260,
        flexShrink: 0,
        position: "sticky",
        top: 64,
        alignSelf: "flex-start",
      }}
    >
      <div className="card" style={{ padding: 12 }}>
        <div style={{ marginBottom: 8, fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>
          General
        </div>
        <nav>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            <li>
              <NavLink to="/" style={linkStyle}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/courses" style={linkStyle}>
                Browse Courses
              </NavLink>
            </li>
            <li>
              <NavLink to="/cart" style={linkStyle}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span
                      aria-label={`${cartCount} items in cart`}
                      style={{
                        background: "#EF4444",
                        color: "#fff",
                        borderRadius: 999,
                        padding: "0 8px",
                        fontSize: 12,
                        fontWeight: 800,
                        lineHeight: "18px",
                        minWidth: 18,
                        textAlign: "center",
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>

      {user && role === "student" && (
        <div className="card" style={{ padding: 12, marginTop: 12 }}>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>
            Student
          </div>
          <nav>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
              <li>
                <NavLink to="/student/dashboard" style={linkStyle}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/courses" style={linkStyle}>
                  My Courses
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/wishlist" style={linkStyle}>
                  Wishlist
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/qa" style={linkStyle}>
                  Q&A
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/settings" style={linkStyle}>
                  Settings
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {user && role === "instructor" && (
        <div className="card" style={{ padding: 12, marginTop: 12 }}>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>
            Instructor
          </div>
          <nav>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
              <li>
                <NavLink to="/instructor/dashboard" style={linkStyle}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/instructor/courses" style={linkStyle}>
                  Courses
                </NavLink>
              </li>
              <li>
                <NavLink to="/instructor/create" style={linkStyle}>
                  Create Course
                </NavLink>
              </li>
              <li>
                <NavLink to="/instructor/reviews" style={linkStyle}>
                  Reviews
                </NavLink>
              </li>
              <li>
                <NavLink to="/instructor/qa" style={linkStyle}>
                  Q&A
                </NavLink>
              </li>
              <li>
                <NavLink to="/instructor/students" style={linkStyle}>
                  Students
                </NavLink>
              </li>
              <li>
                <NavLink to="/instructor/earnings" style={linkStyle}>
                  Earnings
                </NavLink>
              </li>
              <li>
                <NavLink to="/instructor/settings" style={linkStyle}>
                  Settings
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </aside>
  );
}
