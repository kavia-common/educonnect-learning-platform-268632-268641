import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import supabase from "../../supabase/client";
import { toast } from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import useCartStore from "../../store/useCartStore";

/**
 * PUBLIC_INTERFACE
 * Course Detail page: shows course info with tabs for Overview, Curriculum, Reviews, Q&A.
 * Actions:
 * - Add to cart (no duplicate)
 * - Wishlist toggle
 * - Enrol now (if free) -> routes to /checkout
 * Data: courses, course_curriculum, reviews, qa, wishlist tables.
 */
export default function CourseDetail() {
  /** Render detail tabs and actions for a specific course. */
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const { addCourse } = useCartStore();

  const courseId = useMemo(() => {
    const num = Number(id);
    return Number.isFinite(num) ? num : id; // allow UUID as well
  }, [id]);

  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [qa, setQa] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");

  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingTabs, setLoadingTabs] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  // Load course
  useEffect(() => {
    let cancelled = false;
    async function loadCourse() {
      setLoadingCourse(true);
      setErrorMsg("");
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setErrorMsg("Course not found");
        }
        if (!cancelled) setCourse(data);
      } catch (e) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch course", e);
          setErrorMsg(e.message || "Failed to load course");
        }
      } finally {
        if (!cancelled) setLoadingCourse(false);
      }
    }
    if (courseId) loadCourse();
    return () => { cancelled = true; };
  }, [courseId]);

  // Load extra data for active tab
  useEffect(() => {
    let cancelled = false;
    async function loadTabData() {
      if (!courseId) return;
      setLoadingTabs(true);
      try {
        if (activeTab === "curriculum") {
          const { data, error } = await supabase
            .from("course_curriculum")
            .select("*")
            .eq("course_id", courseId)
            .order("order_index", { ascending: true });
          if (error) throw error;
          if (!cancelled) setCurriculum(data || []);
        } else if (activeTab === "reviews") {
          const { data, error } = await supabase
            .from("reviews")
            .select("id, rating, comment, created_at, user_id")
            .eq("course_id", courseId)
            .order("created_at", { ascending: false })
            .limit(20);
          if (error) throw error;
          if (!cancelled) setReviews(data || []);
        } else if (activeTab === "qa") {
          const { data, error } = await supabase
            .from("qa")
            .select("id, question, answer, created_at, user_id")
            .eq("course_id", courseId)
            .order("created_at", { ascending: false })
            .limit(20);
          if (error) throw error;
          if (!cancelled) setQa(data || []);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Failed loading ${activeTab}`, e);
        toast.error(`Failed to load ${activeTab}`);
      } finally {
        if (!cancelled) setLoadingTabs(false);
      }
    }
    loadTabData();
    return () => { cancelled = true; };
  }, [activeTab, courseId]);

  // Load wishlist state
  useEffect(() => {
    let cancelled = false;
    async function checkWishlist() {
      if (!user?.id || !courseId) {
        setWishlisted(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("wishlist")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle();
        if (error && error.code !== "PGRST116") throw error; // ignore no rows
        if (!cancelled) setWishlisted(Boolean(data));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Wishlist check failed", e);
      }
    }
    checkWishlist();
    return () => { cancelled = true; };
  }, [user?.id, courseId]);

  const onAddToCart = async () => {
    if (!course) return;
    try {
      await addCourse(course.id, Number(course.price) || 0);
    } catch (e) {
      toast.error("Failed to add to cart");
    }
  };

  const onEnrollNow = () => {
    // For free courses, route to checkout; enrollment flow will be handled there
    navigate("/checkout");
  };

  const onToggleWishlist = async () => {
    if (!user?.id) {
      toast("Please login to use wishlist");
      return;
    }
    setWishlistBusy(true);
    try {
      if (wishlisted) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("course_id", courseId);
        if (error) throw error;
        setWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        const { error } = await supabase
          .from("wishlist")
          .insert([{ user_id: user.id, course_id: courseId }]);
        if (error) throw error;
        setWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Wishlist toggle failed", e);
      toast.error("Wishlist action failed");
    } finally {
      setWishlistBusy(false);
    }
  };

  const priceLabel = () => {
    if (!course) return "";
    const p = Number(course.price);
    return p > 0 ? `$${p.toFixed(2)}` : "Free";
    };

  return (
    <div className="container">
      {loadingCourse ? (
        <div className="card">Loading course...</div>
      ) : errorMsg ? (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {errorMsg}
          <div style={{ marginTop: 8 }}>
            <Link className="link" to="/courses">Back to catalog</Link>
          </div>
        </div>
      ) : !course ? (
        <div className="card">Course not found.</div>
      ) : (
        <>
          <div className="card" style={{ display: "grid", gap: 8 }}>
            <Link className="link" to="/courses">← Back to catalog</Link>
            <h2 style={{ margin: 0 }}>{course.title}</h2>
            <p style={{ marginTop: 0, color: "#6b7280" }}>{course.subtitle || ""}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: 20 }}>
                {priceLabel()}
              </span>
              <button className="btn" onClick={onAddToCart} aria-label="Add to cart">
                Add to cart
              </button>
              <button
                className="btn"
                onClick={onToggleWishlist}
                disabled={wishlistBusy}
                aria-pressed={wishlisted}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                style={{ background: wishlisted ? "#F59E0B" : "var(--color-primary)" }}
              >
                {wishlisted ? "Wishlisted" : "Wishlist"}
              </button>
              {Number(course.price) === 0 ? (
                <button className="btn" onClick={onEnrollNow} aria-label="Enroll now for free">
                  Enrol now
                </button>
              ) : null}
            </div>
          </div>

          <div className="card" style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="tablist" aria-label="Course sections">
              {[
                { key: "overview", label: "Overview" },
                { key: "curriculum", label: "Curriculum" },
                { key: "reviews", label: "Reviews" },
                { key: "qa", label: "Q&A" },
              ].map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={activeTab === t.key}
                  className="btn"
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    background: activeTab === t.key ? "var(--color-primary)" : "#e5e7eb",
                    color: activeTab === t.key ? "#fff" : "#111827",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div role="tabpanel" aria-live="polite">
              {activeTab === "overview" && (
                <section style={{ paddingTop: 4 }}>
                  <h3 style={{ marginTop: 0 }}>About this course</h3>
                  <p style={{ marginTop: 0 }}>{course.description || "No description provided."}</p>
                </section>
              )}

              {activeTab === "curriculum" && (
                <section>
                  {loadingTabs ? (
                    <div>Loading curriculum…</div>
                  ) : curriculum.length === 0 ? (
                    <div>No curriculum available.</div>
                  ) : (
                    <ol style={{ paddingLeft: 18 }}>
                      {curriculum.map((item) => (
                        <li key={item.id} style={{ marginBottom: 6 }}>
                          <div style={{ fontWeight: 600 }}>{item.title}</div>
                          {item.summary ? (
                            <div style={{ color: "#6b7280", fontSize: 14 }}>{item.summary}</div>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}

              {activeTab === "reviews" && (
                <section>
                  {loadingTabs ? (
                    <div>Loading reviews…</div>
                  ) : reviews.length === 0 ? (
                    <div>No reviews yet.</div>
                  ) : (
                    <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0, display: "grid", gap: 8 }}>
                      {reviews.map((r) => (
                        <li key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong>Rating: {r.rating}/5</strong>
                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                              {new Date(r.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ marginBottom: 0 }}>{r.comment}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {activeTab === "qa" && (
                <section>
                  {loadingTabs ? (
                    <div>Loading Q&A…</div>
                  ) : qa.length === 0 ? (
                    <div>No questions yet.</div>
                  ) : (
                    <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0, display: "grid", gap: 8 }}>
                      {qa.map((q) => (
                        <li key={q.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                          <div style={{ fontWeight: 700 }}>Q: {q.question}</div>
                          <div style={{ marginTop: 6 }}>
                            <span style={{ fontWeight: 700 }}>A: </span>
                            <span>{q.answer || "Not answered yet."}</span>
                          </div>
                          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>
                            {new Date(q.created_at).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
