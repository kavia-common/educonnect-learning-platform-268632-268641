import { Link } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * EnrollmentSuccessPage
 * Displays confirmation after successful enrollment with a clear call-to-action.
 */
export default function EnrollmentSuccessPage() {
  /** Render success confirmation and forward paths to next steps. */
  return (
    <div className="container">
      <section
        className="card"
        aria-labelledby="enrollment-success-title"
        style={{
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(249,250,251,1) 100%)",
        }}
      >
        <header style={{ display: "grid", gap: 8 }}>
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "#2563EB",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              role="img"
              aria-label="Success"
            >
              <path
                d="M20 7L9 18l-5-5"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 id="enrollment-success-title" style={{ margin: "8px 0 0 0" }}>
            Enrollment successful
          </h1>
          <p style={{ marginTop: 4, color: "#374151", maxWidth: 720 }}>
            You’re all set! Your payment has been processed and your courses are
            now available. Head over to your Student Dashboard to start
            learning.
          </p>
        </header>

        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: 12,
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 12,
            padding: 12,
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ fontWeight: 700 }}>What’s next?</div>
          <ul
            style={{
              listStyle: "disc",
              margin: "0 0 0 18px",
              padding: 0,
              color: "#4B5563",
            }}
          >
            <li>Review your enrolled courses on the dashboard</li>
            <li>Track progress and resume where you left off</li>
            <li>Join discussions and ask questions in Q&A</li>
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          <Link
            className="btn"
            to="/student/dashboard"
            aria-label="Go to Student Dashboard"
            style={{
              background:
                "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            }}
          >
            Go to Student Dashboard
          </Link>
          <Link className="btn" to="/courses" aria-label="Browse more courses" style={{ background: "#F59E0B" }}>
            Browse more courses
          </Link>
        </div>
      </section>
    </div>
  );
}
