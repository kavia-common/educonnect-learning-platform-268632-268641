import { useEffect, useState } from "react";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

/**
 * PUBLIC_INTERFACE
 * Instructor Reviews management
 * Lists reviews for instructor's courses and allows responding.
 */
export default function InstructorReviews() {
  /** Review list with respond action. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      setError("");
      try {
        // Get instructor course ids
        const { data: courses, error: cErr } = await supabase
          .from("courses")
          .select("id, title")
          .eq("instructor_id", user.id);
        if (cErr) throw cErr;

        const cids = (courses || []).map((c) => c.id);
        if (!cids.length) {
          setReviews([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("reviews")
          .select("id, course_id, rating, comment, response, created_at, courses:course_id (title)")
          .in("course_id", cids)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setReviews(data || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Load reviews failed", e);
        if (!cancelled) setError(e.message || "Failed to load reviews");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const startRespond = (rid, current) => {
    setRespondingId(rid);
    setResponseText(current || "");
  };

  const submitResponse = async (rid) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ response: responseText.trim() })
        .eq("id", rid);
      if (error) throw error;
      toast.success("Response saved");
      setReviews((prev) => prev.map((r) => (r.id === rid ? { ...r, response: responseText.trim() } : r)));
      setRespondingId(null);
      setResponseText("");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Save response failed", e);
      toast.error("Failed to save response");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Course Reviews</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>Read and respond to student feedback</p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="card">No reviews yet.</div>
      ) : (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {reviews.map((r) => (
              <li key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 700 }}>
                    {r.courses?.title || `Course #${r.course_id}`} — Rating {r.rating}/5
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ marginTop: 6 }}>{r.comment}</div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Your response</div>
                  {respondingId === r.id ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      <textarea
                        rows={3}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        style={{ width: "100%", borderRadius: 10, padding: "8px 10px", border: "1px solid #e5e7eb" }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn" onClick={() => submitResponse(r.id)}>Save</button>
                        <button className="btn" type="button" onClick={() => setRespondingId(null)} style={{ background: "#6b7280" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div>{r.response || <em>No response yet.</em>}</div>
                      <button className="btn" type="button" onClick={() => startRespond(r.id, r.response)}>
                        {r.response ? "Edit response" : "Respond"}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
