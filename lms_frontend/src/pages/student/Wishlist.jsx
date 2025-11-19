import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

/**
 * PUBLIC_INTERFACE
 * Student Wishlist page
 * Lists wished courses with remove action and links to details / add to cart.
 */
export default function StudentWishlist() {
  /** Render wishlist for the logged-in student. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadWishlist = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, course_id, courses:course_id (title, price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setWishlist(data || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Wishlist load failed", e);
      setError(e.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const removeItem = async (wid) => {
    setBusyId(wid);
    try {
      const { error } = await supabase.from("wishlist").delete().eq("id", wid).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Removed from wishlist");
      setWishlist((prev) => prev.filter((w) => w.id !== wid));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Remove wishlist failed", e);
      toast.error("Failed to remove");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Wishlist</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>Your saved courses</p>
        </div>
        <div><Link className="btn" to="/courses">Browse courses</Link></div>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading wishlist...</div>
      ) : wishlist.length === 0 ? (
        <div className="card">
          <p style={{ marginTop: 0 }}>Your wishlist is empty.</p>
          <Link className="link" to="/courses">Browse courses</Link>
        </div>
      ) : (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {wishlist.map((w) => (
              <li key={w.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{w.courses?.title || `Course #${w.course_id}`}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {Number(w.courses?.price) > 0 ? `$${Number(w.courses?.price).toFixed(2)}` : "Free"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link className="btn" to={`/courses/${w.course_id}`}>View</Link>
                  <button className="btn" onClick={() => removeItem(w.id)} disabled={busyId === w.id} style={{ background: "#EF4444" }}>
                    {busyId === w.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
