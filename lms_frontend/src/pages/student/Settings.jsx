import { Link } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * Student Settings hub page
 * Provides quick links to profile editing and other settings sections.
 */
export default function StudentSettings() {
  /** Render settings options. */
  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Settings</h2>
        <p style={{ marginTop: 0, color: "#6b7280" }}>Manage your profile and preferences</p>
      </div>

      <div className="card" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Profile</h3>
            <p style={{ marginTop: 0, color: "#6b7280" }}>Update your personal information and avatar</p>
            <Link className="btn" to="/student/settings/profile-edit">Edit profile</Link>
          </section>

          <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Privacy</h3>
            <p style={{ marginTop: 0, color: "#6b7280" }}>Control visibility and notifications</p>
            <button className="btn" type="button" disabled>Coming soon</button>
          </section>

          <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Billing</h3>
            <p style={{ marginTop: 0, color: "#6b7280" }}>Payment methods and invoices</p>
            <button className="btn" type="button" disabled>Coming soon</button>
          </section>
        </div>
      </div>
    </div>
  );
}
