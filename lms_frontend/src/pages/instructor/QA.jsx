import { useEffect, useState } from "react";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

/**
 * PUBLIC_INTERFACE
 * Instructor Q&A management
 * Lists questions for instructor's courses and allows answering.
 */
export default function InstructorQA() {
  /** Manage unanswered/answered questions. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [qa, setQa] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [answer, setAnswer] = useState("");

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
          setQa([]);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("qa")
          .select("id, course_id, question, answer, created_at, user_id, courses:course_id (title)")
          .in("course_id", cids)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setQa(data || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Load QA failed", e);
        if (!cancelled) setError(e.message || "Failed to load Q&A");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const startAnswer = (item) => {
    setEditingId(item.id);
    setAnswer(item.answer || "");
  };

  const saveAnswer = async (id) => {
    try {
      const payload = { answer: answer.trim() || null };
      const { error } = await supabase.from("qa").update(payload).eq("id", id);
      if (error) throw error;
      toast.success("Answer saved");
      setQa((prev) => prev.map((q) => (q.id === id ? { ...q, ...payload } : q)));
      setEditingId(null);
      setAnswer("");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Save answer failed", e);
      toast.error("Failed to save answer");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Q&A</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>Manage student questions</p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading questions...</div>
      ) : qa.length === 0 ? (
        <div className="card">No questions yet.</div>
      ) : (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {qa.map((q) => (
              <li key={q.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 700 }}>
                    {q.courses?.title || `Course #${q.course_id}`}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {new Date(q.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Q:</strong> {q.question}
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>A:</strong>{" "}
                  {editingId === q.id ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      <textarea
                        rows={3}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        style={{ width: "100%", borderRadius: 10, padding: "8px 10px", border: "1px solid #e5e7eb" }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn" onClick={() => saveAnswer(q.id)}>Save</button>
                        <button className="btn" type="button" onClick={() => setEditingId(null)} style={{ background: "#6b7280" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <span>{q.answer || <em>Not answered yet.</em>}</span>
                  )}
                </div>
                {editingId !== q.id && (
                  <div style={{ marginTop: 8 }}>
                    <button className="btn" type="button" onClick={() => startAnswer(q)}>
                      {q.answer ? "Edit answer" : "Answer"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
