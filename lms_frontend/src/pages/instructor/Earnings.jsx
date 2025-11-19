import { useEffect, useMemo, useState } from "react";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";

/**
 * PUBLIC_INTERFACE
 * Instructor Earnings
 * Summarizes orders and basic payout total.
 */
export default function InstructorEarnings() {
  /** Render earnings summary from orders that include instructor's courses. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
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
          .select("id")
          .eq("instructor_id", user.id);
        if (cErr) throw cErr;
        const cids = (courses || []).map((c) => c.id);
        if (!cids.length) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const { data: oi, error: oiErr } = await supabase
          .from("order_items")
          .select("order_id, course_id, price, quantity")
          .in("course_id", cids);
        if (oiErr) throw oiErr;
        const orderIds = Array.from(new Set((oi || []).map((i) => i.order_id)));
        if (!orderIds.length) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const { data: ords, error: oErr } = await supabase
          .from("orders")
          .select("id, total_amount, created_at, status")
          .in("id", orderIds)
          .order("created_at", { ascending: false });
        if (oErr) throw oErr;

        const byOrder = {};
        (oi || []).forEach((i) => {
          if (!byOrder[i.order_id]) byOrder[i.order_id] = [];
          byOrder[i.order_id].push(i);
        });

        const rows = (ords || []).map((o) => ({
          ...o,
          items: byOrder[o.id] || [],
        }));

        if (!cancelled) setOrders(rows);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Load earnings failed", e);
        if (!cancelled) setError(e.message || "Failed to load earnings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const total = useMemo(
    () =>
      orders.reduce(
        (s, o) =>
          s +
          (o.items || []).reduce(
            (ss, i) => ss + Number(i.price || 0) * Number(i.quantity || 1),
            0
          ),
        0
      ),
    [orders]
  );

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Earnings</h2>
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          Orders including your courses and estimated earnings
        </p>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading earnings...</div>
      ) : (
        <>
          <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Total Estimated Earnings</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>${Number(total).toFixed(2)}</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Orders</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{orders.length}</div>
            </div>
          </div>

          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ marginTop: 0 }}>Recent Orders</h3>
            {orders.length === 0 ? (
              <div>No orders yet.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {orders.map((o) => (
                  <li key={o.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 700 }}>Order #{o.id}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>
                        {new Date(o.created_at).toLocaleString()} · {o.status}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
                      Items related to your courses: {(o.items || []).length}
                    </div>
                    <div style={{ marginTop: 6, fontWeight: 700 }}>
                      Estimated share: $
                      {((o.items || []).reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 1), 0)).toFixed(2)}
                    </div>
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
