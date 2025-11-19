import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

/**
 * Main application layout with persistent header, sidebar for dashboard links,
 * and footer. Content area renders child routes.
 */

// PUBLIC_INTERFACE
export default function AppLayout({ children }) {
  /** Provides the page chrome for the app with responsive layout. */
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <Header />
      <div
        className="container"
        style={{
          display: "flex",
          gap: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        {/* Sidebar hidden on very small screens via CSS media query alternative */}
        <div
          style={{
            display: "none",
          }}
          className="sidebar-hide"
        />
        <div style={{ display: "none" }} className="sidebar-placeholder" />
        <div style={{ display: "block" }}>
          <Sidebar />
        </div>

        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
      <Footer />
    </div>
  );
}
