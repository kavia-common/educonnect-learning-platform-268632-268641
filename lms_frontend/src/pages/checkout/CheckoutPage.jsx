import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { nanoid } from "nanoid";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";
import useCartStore from "../../store/useCartStore";

/**
 * PUBLIC_INTERFACE
 * CheckoutPage
 * Handles user checkout: review personal details, apply coupon, select payment method,
 * simulate payment processing, create order + order_items + enrollments in Supabase,
 * clear cart (both local and Supabase), and navigate to success page.
 */
export default function CheckoutPage() {
  /** Render checkout flow with simulated payment and order persistence. */
  const navigate = useNavigate();
  const { user, profile, status } = useAuthStore();
  const { items, userId, loadCartForUser, clearCart } = useCartStore();

  // Read-only personal details derived from profile/user with edit option linking to settings
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [editing, setEditing] = useState(false);

  // Coupon handling
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null); // { code, type: 'percent'|'fixed', value }
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("processing"); // 'processing' | 'paypal' | 'card'
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);

  // Load cart if needed after auth finishes
  useEffect(() => {
    if (status === "authenticated" && user?.id && !userId) {
      loadCartForUser(user.id).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user?.id]);

  useEffect(() => {
    // Sync local editable fields when profile/user load
    if (profile?.full_name) setFullName(profile.full_name);
    if (user?.email) setEmail(user.email);
  }, [profile?.full_name, user?.email]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.price || 0) * 1, 0),
    [items]
  );

  // Simulate coupon: "SAVE10" -> 10% off, "FLAT5" -> $5 off, "FREE" -> 100% off
  const discount = useMemo(() => {
    if (!couponApplied) return 0;
    if (couponApplied.type === "percent") {
      return Math.min(subtotal, (subtotal * couponApplied.value) / 100);
    }
    if (couponApplied.type === "fixed") {
      return Math.min(subtotal, couponApplied.value);
    }
    return 0;
  }, [couponApplied, subtotal]);

  // For simplicity, apply tax after discount
  const taxRate = 0.07;
  const taxable = Math.max(subtotal - discount, 0);
  const tax = useMemo(() => taxable * taxRate, [taxable]);
  const total = useMemo(() => Math.max(taxable + tax, 0), [taxable, tax]);

  const applyCoupon = async (e) => {
    e.preventDefault();
    setCouponBusy(true);
    setCouponError("");
    try {
      const code = (couponCode || "").trim().toUpperCase();
      if (!code) {
        setCouponApplied(null);
        toast("Enter a coupon code");
        return;
      }
      if (code === "SAVE10") {
        setCouponApplied({ code, type: "percent", value: 10 });
        toast.success("Coupon applied: 10% off");
      } else if (code === "FLAT5") {
        setCouponApplied({ code, type: "fixed", value: 5 });
        toast.success("Coupon applied: $5 off");
      } else if (code === "FREE") {
        setCouponApplied({ code, type: "percent", value: 100 });
        toast.success("Coupon applied: 100% off");
      } else {
        setCouponApplied(null);
        setCouponError("Invalid coupon code");
      }
    } finally {
      setCouponBusy(false);
    }
  };

  const validateBeforePay = () => {
    if (!user?.id) {
      toast.error("Please login to continue.");
      return false;
    }
    if (!items.length) {
      toast("Your cart is empty");
      return false;
    }
    if (!fullName || !email) {
      toast.error("Please ensure your name and email are present.");
      return false;
    }
    if (!agree) {
      toast("Please accept terms to proceed");
      return false;
    }
    return true;
  };

  // Simulated payment processing helper (returns success after timeout)
  const simulatePayment = async (amount, method) => {
    // In real integration, call a payment provider. Here we simulate.
    await new Promise((r) => setTimeout(r, Math.min(2000, 800 + amount)));
    return { status: "succeeded", method, paid_at: new Date().toISOString() };
  };

  const handleConfirmPayment = async () => {
    if (!validateBeforePay()) return;

    setPaying(true);
    const txnId = nanoid();

    try {
      // Simulate payment
      const payment = await simulatePayment(total * 100, paymentMethod);
      if (payment.status !== "succeeded") {
        toast.error("Payment failed. Please try another method.");
        setPaying(false);
        return;
      }

      // Create order in Supabase
      const orderPayload = {
        user_id: user.id,
        transaction_id: txnId,
        payment_method: paymentMethod,
        coupon_code: couponApplied?.code || null,
        discount_amount: Number(discount.toFixed(2)),
        subtotal_amount: Number(subtotal.toFixed(2)),
        tax_amount: Number(tax.toFixed(2)),
        total_amount: Number(total.toFixed(2)),
        status: "paid",
        customer_name: fullName,
        customer_email: email,
        paid_at: payment.paid_at,
      };

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert([orderPayload])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Create order_items
      const orderItems = items.map((i) => ({
        order_id: order.id,
        course_id: i.courseId,
        price: Number(i.price || 0),
        quantity: 1,
      }));

      if (orderItems.length) {
        const { error: oiErr } = await supabase.from("order_items").insert(orderItems);
        if (oiErr) throw oiErr;
      }

      // Create enrollments for all items
      const enrollments = items.map((i) => ({
        user_id: user.id,
        course_id: i.courseId,
        order_id: order.id,
        enrolled_at: new Date().toISOString(),
        status: "active",
      }));

      if (enrollments.length) {
        const { error: enrErr } = await supabase.from("enrollments").insert(enrollments);
        if (enrErr) throw enrErr;
      }

      // Clear cart
      await clearCart();

      toast.success("Payment complete! You're enrolled.");
      navigate("/enrollment-success", { replace: true });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Checkout failed:", e);
      toast.error(e?.message || "Checkout failed");
    } finally {
      setPaying(false);
    }
  };

  // Derived breadcrumb
  const Breadcrumb = () => (
    <nav aria-label="Breadcrumb" style={{ fontSize: 14 }}>
      <ol style={{ display: "flex", gap: 8, listStyle: "none", padding: 0, margin: 0, color: "#6b7280" }}>
        <li><Link className="link" to="/">Home</Link></li>
        <li>/</li>
        <li><Link className="link" to="/courses">Courses</Link></li>
        <li>/</li>
        <li><Link className="link" to="/cart">Cart</Link></li>
        <li>/</li>
        <li aria-current="page" style={{ color: "var(--text)", fontWeight: 700 }}>Checkout</li>
      </ol>
    </nav>
  );

  const DetailsSection = () => (
    <section className="card" aria-labelledby="personal-details">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 id="personal-details" style={{ margin: 0 }}>Personal details</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn"
            type="button"
            onClick={() => setEditing((e) => !e)}
            aria-pressed={editing}
            style={{ background: editing ? "#F59E0B" : "var(--color-primary)" }}
          >
            {editing ? "Done" : "Edit"}
          </button>
          <Link className="btn" to="/student/settings">Profile Settings</Link>
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label htmlFor="full_name" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Full name
          </label>
          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            readOnly={!editing}
            aria-readonly={!editing}
            style={{
              width: "100%",
              borderRadius: 10,
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              background: editing ? "#fff" : "#f3f4f6",
            }}
          />
        </div>
        <div>
          <label htmlFor="email" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={!editing}
            aria-readonly={!editing}
            style={{
              width: "100%",
              borderRadius: 10,
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              background: editing ? "#fff" : "#f3f4f6",
            }}
          />
        </div>
      </div>
    </section>
  );

  const CouponSection = () => (
    <section className="card" aria-labelledby="coupon">
      <h3 id="coupon" style={{ marginTop: 0 }}>Have a coupon?</h3>
      <form onSubmit={applyCoupon} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Enter coupon (SAVE10, FLAT5, FREE)"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          style={{
            flex: "1 1 260px",
            minWidth: 220,
            borderRadius: 10,
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
          }}
          aria-invalid={!!couponError}
        />
        <button className="btn" type="submit" disabled={couponBusy}>
          {couponBusy ? "Applying..." : "Apply"}
        </button>
      </form>
      {couponApplied && (
        <div style={{ marginTop: 8, fontSize: 14, color: "#065f46" }}>
          Applied: <strong>{couponApplied.code}</strong>{" "}
          {couponApplied.type === "percent" ? `(${couponApplied.value}% off)` : `($${couponApplied.value.toFixed(2)} off)`}
        </div>
      )}
      {couponError && (
        <div style={{ marginTop: 8, background: "#FEF2F2", color: "#7F1D1D", padding: 8, borderRadius: 8 }}>
          {couponError}
        </div>
      )}
    </section>
  );

  const SummarySection = () => (
    <section className="card" aria-labelledby="order-summary">
      <h3 id="order-summary" style={{ marginTop: 0 }}>Order summary</h3>
      <div role="list" aria-label="Items in order" style={{ display: "grid", gap: 8 }}>
        {items.map((i) => (
          <div
            role="listitem"
            key={i.courseId}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <strong>Course #{i.courseId}</strong>
              <span style={{ color: "#6b7280", fontSize: 12 }}>Qty: 1</span>
            </div>
            <div style={{ fontWeight: 700 }}>
              {Number(i.price) > 0 ? `$${Number(i.price).toFixed(2)}` : "Free"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Cart subtotal</span>
          <span style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Discount</span>
          <span style={{ fontWeight: 700, color: discount > 0 ? "#065f46" : "inherit" }}>
            -${discount.toFixed(2)}
          </span>
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
      </div>
    </section>
  );

  const PaymentSection = () => (
    <section className="card" aria-labelledby="payment-methods">
      <h3 id="payment-methods" style={{ marginTop: 0 }}>Payment Methods (simulated)</h3>
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend className="sr-only">Select a payment method</legend>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="radio"
              name="payment"
              value="processing"
              checked={paymentMethod === "processing"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>Processing (default demo)</span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="radio"
              name="payment"
              value="paypal"
              checked={paymentMethod === "paypal"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>PayPal (simulated)</span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>Credit/Debit Card (simulated)</span>
          </label>
        </div>
      </fieldset>
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I agree to the Terms and Refund policy</span>
        </label>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          className="btn"
          type="button"
          onClick={handleConfirmPayment}
          disabled={paying || !items.length || !user}
          aria-label="Confirm payment and complete checkout"
        >
          {paying ? "Processing..." : "Confirm payment"}
        </button>
      </div>
    </section>
  );

  if (status === "loading") {
    return (
      <div className="container">
        <div className="card">Preparing checkout...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h2>Checkout</h2>
          <p>You must be logged in to checkout.</p>
          <Link className="btn" to="/login" state={{ from: { pathname: "/checkout" } }}>
            Login to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Breadcrumb />
          <h2 style={{ marginBottom: 0 }}>Checkout</h2>
          <p style={{ marginTop: 4, color: "#6b7280" }}>
            Review your details and complete payment to enroll.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn" to="/cart">Back to cart</Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p style={{ marginTop: 0 }}>Your cart is empty.</p>
          <Link className="link" to="/courses">Browse courses</Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 0.7fr",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <DetailsSection />
            <CouponSection />
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <SummarySection />
            <PaymentSection />
          </div>
        </div>
      )}
    </div>
  );
}
