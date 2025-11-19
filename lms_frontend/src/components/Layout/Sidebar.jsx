import { NavLink } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

/**
 * Sidebar with navigation links for student and instructor areas.
 * Only shows sections relevant to the current user role.
 */

// PUBLIC_INTERFACE
export default function Sidebar() {
  /** Role-aware sidebar links for dashboards and settings. */
  const { user, profile } = useAuthStore();
  const role = profile?.role;

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
                Cart
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
            </ul>
          </nav>
        </div>
      )}
    </aside>
  );
}
