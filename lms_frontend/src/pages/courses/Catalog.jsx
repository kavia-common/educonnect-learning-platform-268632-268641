import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import supabase from "../../supabase/client";
import Toast from "../../components/UI/Toast";
import Skeleton from "../../components/UI/Skeleton";
import EmptyState from "../../components/UI/EmptyState";
import useAuthStore from "../../store/useAuthStore";
import useCartStore from "../../store/useCartStore";

/**
 * PUBLIC_INTERFACE
 * Catalog page: lists courses with server-side pagination and search (?q=).
 * Uses Supabase 'courses' table. Pagination via limit/offset.
 */
export default function Catalog() {
  /** Render course catalog with search and pagination; actions: add to cart, wishlist toggle. */
  const { user } = useAuthStore();
  const { addCourse } = useCartStore();

  const location = useLocation();
  const navigate = useNavigate();

  // query params q (search), page (1-indexed), limit
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialQ = params.get("q") || "";
  const initialPage = Math.max(parseInt(params.get("page") || "1", 10), 1);
  const initialLimit = Math.min(Math.max(parseInt(params.get("limit") || "9", 10), 1), 50);

  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const [courses, setCourses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // wishlist state (ids in user's wishlist)
  const [wishlistSet, setWishlistSet] = useState(new Set());
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const offset = (page - 1) * limit;
  const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

  // Sync state if user navigates via back/forward buttons by listening to location.search
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const newQ = sp.get("q") || "";
    const newPage = Math.max(parseInt(sp.get("page") || "1", 10), 1);
    const newLimit = Math.min(Math.max(parseInt(sp.get("limit") || "9", 10), 1), 50);

    // Only set if changed to avoid loops
    setQ((prev) => (prev !== newQ ? newQ : prev));
    setPage((prev) => (prev !== newPage ? newPage : prev));
    setLimit((prev) => (prev !== newLimit ? newLimit : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Update query params in URL when search or page changes (push state)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (page !== 1) sp.set("page", String(page));
    if (limit !== 9) sp.set("limit", String(limit));
    const qs = sp.toString();
    const newUrl = qs ? `/courses?${qs}` : "/courses";
    if (newUrl !== location.pathname + location.search) {
      navigate(newUrl); // push to enable back button across paginated search
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, limit]);

  // Load courses
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      setLoading(true);
      setErrMsg("");
      try {
        let query = supabase
          .from("courses")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (q) {
          // Basic search: ilike against title/description
          query = supabase
            .from("courses")
            .select("*", { count: "exact" })
            .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        if (!isCancelled) {
          setCourses(data || []);
          setTotalCount(count || 0);
        }
      } catch (e) {
        if (!isCancelled) {
          // eslint-disable-next-line no-console
          console.error("Failed to load courses", e);
          setErrMsg(e.message || "Failed to load courses");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [q, page, limit, offset]);

  // Load wishlist for current user
  useEffect(() => {
    let isCancelled = false;
    async function loadWishlist() {
      if (!user?.id) {
        setWishlistSet(new Set());
        return;
      }
      setLoadingWishlist(true);
      try {
        const { data, error } = await supabase
          .from("wishlist")
          .select("course_id")
          .eq("user_id", user.id);
        if (error) throw error;
        const set = new Set((data || []).map((w) => w.course_id));
        if (!isCancelled) setWishlistSet(set);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load wishlist", e);
      } finally {
        if (!isCancelled) setLoadingWishlist(false);
      }
    }
    loadWishlist();
    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const onAddToCart = async (course) => {
    try {
      await addCourse(course.id, course.price ?? 0);
      Toast.success("Added to cart");
    } catch (e) {
      Toast.error("Could not add to cart");
    }
  };

  const toggleWishlist = async (courseId) => {
    if (!user?.id) {
      Toast.info("Please login to use wishlist");
      return;
    }
    try {
      const isWishlisted = wishlistSet.has(courseId);
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("course_id", courseId);
        if (error) throw error;
        const ns = new Set(wishlistSet);
        ns.delete(courseId);
        setWishlistSet(ns);
        Toast.success("Removed from wishlist");
      } else {
        const { error } = await supabase
          .from("wishlist")
          .insert([{ user_id: user.id, course_id: courseId }]);
        if (error) throw error;
        const ns = new Set(wishlistSet);
        ns.add(courseId);
        setWishlistSet(ns);
        Toast.success("Added to wishlist");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Wishlist toggle failed", e);
      Toast.error("Wishlist action failed");
    }
  };

  const changePage = (next) => {
    const np = Math.min(Math.max(next, 1), totalPages);
    setPage(np);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 style={{ marginTop: 0 }}>Courses</h2>
        <form onSubmit={onSearchSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="search" aria-label="Search catalog">
          <input
            type="search"
            placeholder="Search courses..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              flex: "1 1 320px",
              minWidth: 220,
              borderRadius: 10,
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
            }}
            aria-label="Search courses"
          />
          <button className="btn" type="submit">Search</button>
        </form>
      </div>

      {errMsg && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {errMsg}
        </div>
      )}

      {loading ? (
        <div
          className="card"
          aria-busy="true"
          aria-live="polite"
          style={{ display: "grid", gap: 12 }}
        >
          <Skeleton.Text lines={2} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                <Skeleton height={18} />
                <div style={{ height: 8 }} />
                <Skeleton.Text lines={3} />
                <div style={{ height: 8 }} />
                <Skeleton width={80} height={18} />
                <div style={{ height: 8 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Skeleton width={90} height={32} />
                  <Skeleton width={100} height={32} />
                  <Skeleton width={80} height={32} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {courses.length === 0 ? (
            <EmptyState
              title="No courses found"
              description="Try adjusting your search or filters."
              actionLabel="Browse all"
              to="/courses"
              ariaLabel="No courses found"
            />
          ) : (
            <div
              className="card"
              role="list"
              aria-label="Course results"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              {courses.map((c) => (
                <article
                  key={c.id}
                  role="listitem"
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <Link to={`/courses/${c.id}`} className="link" style={{ textDecoration: "none" }}>
                    <h3 style={{ margin: "4px 0" }}>{c.title}</h3>
                  </Link>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
                    {(c.description || "").slice(0, 120)}{(c.description || "").length > 120 ? "…" : ""}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    {Number(c.price) > 0 ? (
                      <span style={{ fontWeight: 700 }}>${Number(c.price).toFixed(2)}</span>
                    ) : (
                      <span style={{ fontWeight: 700, color: "var(--color-secondary)" }}>Free</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button className="btn" onClick={() => onAddToCart(c)} aria-label={`Add ${c.title} to cart`}>
                      Add to cart
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => toggleWishlist(c.id)}
                      disabled={loadingWishlist}
                      aria-pressed={wishlistSet.has(c.id)}
                      aria-label={wishlistSet.has(c.id) ? "Remove from wishlist" : "Add to wishlist"}
                      style={{
                        background: wishlistSet.has(c.id) ? "#F59E0B" : "var(--color-primary)",
                      }}
                    >
                      {wishlistSet.has(c.id) ? "Wishlisted" : "Wishlist"}
                    </button>
                    <Link className="btn" to={`/courses/${c.id}`} aria-label={`View details for ${c.title}`}>
                      Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              Page {page} of {totalPages} · {totalCount} results
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => changePage(1)} disabled={page === 1}>
                « First
              </button>
              <button className="btn" onClick={() => changePage(page - 1)} disabled={page <= 1}>
                ‹ Prev
              </button>
              <button className="btn" onClick={() => changePage(page + 1)} disabled={page >= totalPages}>
                Next ›
              </button>
              <button className="btn" onClick={() => changePage(totalPages)} disabled={page === totalPages}>
                Last »
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
