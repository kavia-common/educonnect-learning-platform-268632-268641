import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";

/**
 * PUBLIC_INTERFACE
 * Student Courses (Enrollments) page
 * Lists all enrollments and provides a "Continue" button linking to course detail.
 */
export default function StudentCourses() {
  /** Render user enrollments list with continue button. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        // join with courses for title if available
        const { data, error } = await supabase
          .from("enrollments")
          .select("id, course_id, status, enrolled_at, courses:course_id (title, price)")
          .eq("user_id", user.id)
          .order("enrolled_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setEnrollments(data || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Load enrollments failed", e);
        if (!cancelled) setError(e.message || "Failed to load enrollments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>My Courses</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>All your enrollments</p>
        </div>
        <div><Link className="btn" to="/courses">Browse more</Link></div>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading enrollments...</div>
      ) : enrollments.length === 0 ? (
        <div className="card">
          <p style={{ marginTop: 0 }}>You have no enrollments yet.</p>
          <Link className="link" to="/courses">Browse courses</Link>
        </div>
      ) : (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {enrollments.map((e) => (
              <li key={e.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{e.courses?.title || `Course #${e.course_id}`}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    Enrolled {new Date(e.enrolled_at).toLocaleDateString()} · {e.status}
                  </div>
                </div>
                <Link className="btn" to={`/courses/${e.course_id}`}>Continue</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
