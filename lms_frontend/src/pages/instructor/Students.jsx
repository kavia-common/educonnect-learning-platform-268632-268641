import { useEffect, useMemo, useState } from "react";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";

/**
 * PUBLIC_INTERFACE
 * Instructor Students
 * Shows enrolled students per course.
 */
export default function InstructorStudents() {
  /** Display enrolled students grouped by course. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      setError("");
      try {
        const { data: courses, error: cErr } = await supabase
          .from("courses")
          .select("id, title")
          .eq("instructor_id", user.id);
        if (cErr) throw cErr;
        const cids = (courses || []).map((c) => c.id);
        if (!cids.length) {
          setGrouped({});
          setLoading(false);
          return;
        }
        const { data: enrs, error } = await supabase
          .from("enrollments")
          .select("id, course_id, user_id, enrolled_at, status, users:user_id(email)")
          .in("course_id", cids)
          .order("enrolled_at", { ascending: false });
        if (error) throw error;

        const m = {};
        (enrs || []).forEach((e) => {
          const key = e.course_id;
          if (!m[key]) {
            const ct = (courses || []).find((c) => c.id === key);
            m[key] = { course: ct, students: [] };
          }
          m[key].students.push(e);
        });
        if (!cancelled) setGrouped(m);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Load students failed", e);
        if (!cancelled) setError(e.message || "Failed to load students");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const courseIds = useMemo(() => Object.keys(grouped), [grouped]);

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Enrolled Students</h2>
        <p style={{ marginTop: 0, color: "#6b7280" }}>View students per course</p>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading students...</div>
      ) : courseIds.length === 0 ? (
        <div className="card">No enrollments found.</div>
      ) : (
        courseIds.map((cid) => (
          <div key={cid} className="card" style={{ display: "grid", gap: 8 }}>
            <h3 style={{ marginTop: 0 }}>{grouped[cid].course?.title || `Course #${cid}`}</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {grouped[cid].students.map((e) => (
                <li
                  key={e.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{e.users?.email || e.user_id}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>
                      {new Date(e.enrolled_at).toLocaleString()} · {e.status}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
