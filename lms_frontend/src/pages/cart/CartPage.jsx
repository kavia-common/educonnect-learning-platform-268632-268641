import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCartStore from "../../store/useCartStore";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

/**
 * PUBLIC_INTERFACE
 * CartPage: Lists courses added to cart, allows removal, shows summary, and proceeds to checkout.
 * Behavior:
 *  - Enforces quantity=1 per course and prevents duplicates (handled in store).
 *  - Persists to Supabase for logged-in users and localStorage for guests.
 *  - Merges guest cart into user cart on login (handled in Bootstrap via store methods).
 *  - Shows toasts, inline errors, and loading states.
 */
export default function CartPage() {
  /** Render the cart list with summary and actions. */
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    items,
    loading,
    error,
    userId,
    removeCourse,
    clearCart,
    loadCartForUser,
  } = useCartStore();

  const [busyId, setBusyId] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    // if user logs in and store not yet synced, ensure cart is loaded
    if (user?.id && !userId) {
      loadCartForUser(user.id).catch(() => {
        /* handled in store */
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.price || 0) * 1, 0),
    [items]
  );
  const taxRate = 0.07; // 7% demo rate; in real app, derive by locale
  const tax = useMemo(() => subtotal * taxRate, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const onRemove = async (courseId) => {
    setBusyId(courseId);
    try {
      await removeCourse(courseId);
    } finally {
      setBusyId(null);
    }
  };

  const onClear = async () => {
    if (!items.length) return;
    setClearing(true);
    try {
      await clearCart();
    } finally {
      setClearing(false);
    }
  };

  const onCheckout = () => {
    if (!items.length) {
      toast("Your cart is empty");
      return;
    }
    // If user not logged in, prompt to log in before checkout
    if (!user) {
      toast("Please login to continue to checkout");
      navigate("/login", { replace: true, state: { from: { pathname: "/checkout" } } });
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Your Cart</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn" to="/courses">Continue shopping</Link>
          <button className="btn" onClick={onClear} disabled={!items.length || clearing}>
            {clearing ? "Clearing..." : "Clear cart"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {String(error?.message || error)}
        </div>
      )}

      {loading ? (
        <div className="card">Loading your cart...</div>
      ) : items.length === 0 ? (
        <div className="card">
          <p style={{ marginTop: 0 }}>Your cart is empty.</p>
          <Link className="link" to="/courses">Browse courses</Link>
        </div>
      ) : (
        <>
          <div className="card" style={{ display: "grid", gap: 12 }}>
            <div role="list" aria-label="Cart items" style={{ display: "grid", gap: 8 }}>
              {items.map((i) => (
                <article
                  key={i.id}
                  role="listitem"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <strong>Course #{i.courseId}</strong>
                    <div style={{ color: "#6b7280", fontSize: 14 }}>
                      Quantity: 1 (courses are licensed per seat)
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ minWidth: 96, textAlign: "right", fontWeight: 700 }}>
                      {Number(i.price) > 0 ? `$${Number(i.price).toFixed(2)}` : "Free"}
                    </div>
                    <button
                      className="btn"
                      onClick={() => onRemove(i.courseId)}
                      disabled={busyId === i.courseId}
                      aria-label={`Remove course ${i.courseId} from cart`}
                      style={{ background: "#EF4444" }}
                    >
                      {busyId === i.courseId ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div
            className="card"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Estimated Tax (7%)</span>
              <span style={{ fontWeight: 700 }}>${tax.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px dashed #e5e7eb",
                paddingTop: 8,
                marginTop: 4,
              }}
            >
              <span style={{ fontWeight: 800 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 18 }}>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn" onClick={onCheckout} aria-label="Proceed to checkout">
                Proceed to checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
