import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

/**
 * PUBLIC_INTERFACE
 * Student Dashboard page
 * Shows quick metrics: total enrollments, active courses, wishlist count, questions asked.
 * Lists a few recent enrollments with continue buttons.
 */
export default function StudentDashboard() {
  /** Render metrics and recent enrollments summary for the student. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ enrollments: 0, active: 0, wishlist: 0, questions: 0 });
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [{ data: enr, error: enrErr }, { data: wish, error: wishErr }, { data: qa, error: qaErr }] =
          await Promise.all([
            supabase.from("enrollments").select("id, course_id, status, enrolled_at").eq("user_id", user.id).order("enrolled_at", { ascending: false }).limit(5),
            supabase.from("wishlist").select("id").eq("user_id", user.id),
            supabase.from("qa").select("id").eq("user_id", user.id),
          ]);
        if (enrErr) throw enrErr;
        if (wishErr) throw wishErr;
        if (qaErr) throw qaErr;

        const activeCount = (enr || []).filter((e) => e.status === "active").length;
        if (!cancelled) {
          setRecent(enr || []);
          setMetrics({
            enrollments: (enr || []).length,
            active: activeCount,
            wishlist: (wish || []).length,
            questions: (qa || []).length,
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Dashboard load failed", e);
        if (!cancelled) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const metricCard = (label, value) => (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );

  const courseContinue = (courseId) => {
    toast("Continuing course...");
    // For now, send to course details; in future, jump to last lesson
    return `/courses/${courseId}`;
  };

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Dashboard</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>Overview of your learning</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" to="/student/courses">My Courses</Link>
          <Link className="btn" to="/student/wishlist">Wishlist</Link>
          <Link className="btn" to="/student/qa">Q&A</Link>
          <Link className="btn" to="/student/settings">Settings</Link>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading your dashboard...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {metricCard("Total Enrollments", metrics.enrollments)}
            {metricCard("Active Courses", metrics.active)}
            {metricCard("Wishlist", metrics.wishlist)}
            {metricCard("Questions Asked", metrics.questions)}
          </div>

          <div className="card" style={{ display: "grid", gap: 8 }}>
            <h3 style={{ marginTop: 0 }}>Recent Enrollments</h3>
            {recent.length === 0 ? (
              <div>No enrollments yet. <Link className="link" to="/courses">Browse courses</Link></div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {recent.map((e) => (
                  <li key={e.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Course #{e.course_id}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>
                        Enrolled {new Date(e.enrolled_at).toLocaleDateString()} · {e.status}
                      </div>
                    </div>
                    <Link className="btn" to={courseContinue(e.course_id)}>Continue</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
