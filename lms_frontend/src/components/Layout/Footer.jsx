import { Link } from "react-router-dom";

/**
 * Simple footer with brand mention and helpful links.
 */

// PUBLIC_INTERFACE
export default function Footer() {
  /** Footer across the application with helpful links. */
  return (
    <footer
      style={{
        marginTop: "auto",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
      }}
      aria-label="Footer"
    >
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, color: "#6b7280" }}>
          © {new Date().getFullYear()} Digital T3 LMS
        </div>
        <nav aria-label="Footer">
          <ul style={{ listStyle: "none", display: "flex", gap: 12, margin: 0, padding: 0 }}>
            <li><Link className="link" to="/courses">Courses</Link></li>
            <li><Link className="link" to="/login">Login</Link></li>
            <li><Link className="link" to="/register">Register</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
