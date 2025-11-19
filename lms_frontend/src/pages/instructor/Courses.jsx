import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

/**
 * PUBLIC_INTERFACE
 * Instructor Courses management
 * Lists instructor's courses with ability to toggle publish and quick edit of price/title.
 */
export default function InstructorCourses() {
  /** Manage instructor courses list with publish and simple edit. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadCourses = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCourses(data || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Load courses failed", e);
      setError(e.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const togglePublish = async (course) => {
    setBusyId(course.id);
    try {
      const { error } = await supabase
        .from("courses")
        .update({ published: !course.published })
        .eq("id", course.id)
        .eq("instructor_id", user.id);
      if (error) throw error;
      toast.success(!course.published ? "Published" : "Unpublished");
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, published: !c.published } : c))
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Publish toggle failed", e);
      toast.error("Publish action failed");
    } finally {
      setBusyId(null);
    }
  };

  const quickSave = async (courseId, field, value) => {
    setBusyId(courseId);
    try {
      const payload = { [field]: field === "price" ? Number(value) : value };
      const { error } = await supabase
        .from("courses")
        .update(payload)
        .eq("id", courseId)
        .eq("instructor_id", user.id);
      if (error) throw error;
      toast.success("Saved");
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, ...payload } : c))
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Quick edit failed", e);
      toast.error("Save failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container">
      <div
        className="card"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div>
          <h2 style={{ margin: 0 }}>My Courses</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Manage and update your courses
          </p>
        </div>
        <div>
          <Link className="btn" to="/instructor/create">Create Course</Link>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="card">No courses yet. Create your first course.</div>
      ) : (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {courses.map((c) => (
              <li
                key={c.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 10,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>
                    <input
                      defaultValue={c.title || ""}
                      onBlur={(e) => quickSave(c.id, "title", e.target.value)}
                      aria-label="Title"
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "6px 8px",
                        minWidth: 220,
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn"
                      onClick={() => togglePublish(c)}
                      disabled={busyId === c.id}
                      style={{ background: c.published ? "#F59E0B" : "var(--color-primary)" }}
                    >
                      {busyId === c.id ? "Working..." : c.published ? "Unpublish" : "Publish"}
                    </button>
                    <Link className="btn" to={`/courses/${c.id}`}>View</Link>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ fontSize: 12, color: "#6b7280" }}>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(c.price || 0)}
                    onBlur={(e) => quickSave(c.id, "price", e.target.value)}
                    aria-label="Price"
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "6px 8px",
                      width: 120,
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    Status: {c.published ? "Published" : "Draft"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
