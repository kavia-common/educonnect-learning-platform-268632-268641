import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";

/**
 * PUBLIC_INTERFACE
 * Instructor Dashboard
 * Shows high-level metrics: total courses, enrollments across courses, pending reviews/questions, total earnings.
 */
export default function InstructorDashboard() {
  /** Render instructor metrics and quick actions. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    courses: 0,
    enrollments: 0,
    pendingReviews: 0,
    pendingQuestions: 0,
    totalEarnings: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      setError("");
      try {
        // Load instructor courses
        const { data: courses, error: cErr } = await supabase
          .from("courses")
          .select("id, price")
          .eq("instructor_id", user.id);
        if (cErr) throw cErr;
        const courseIds = (courses || []).map((c) => c.id);
        let enrollmentsCount = 0;
        let reviewsPending = 0;
        let qaPending = 0;
        let totalEarnings = 0;

        if (courseIds.length) {
          const [{ data: enrs, error: eErr }, { data: revs, error: rErr }, { data: qs, error: qErr }, { data: ordersAgg, error: oErr }] =
            await Promise.all([
              supabase.from("enrollments").select("id").in("course_id", courseIds),
              supabase.from("reviews").select("id, response").in("course_id", courseIds),
              supabase.from("qa").select("id, answer").in("course_id", courseIds),
              supabase
                .from("orders")
                .select("total_amount")
                .in(
                  "id",
                  // get orders via order_items for instructor's courses
                  (
                    await supabase
                      .from("order_items")
                      .select("order_id")
                      .in("course_id", courseIds)
                  ).data?.map((o) => o.order_id) || [-1]
                ),
            ]);
          if (eErr) throw eErr;
          if (rErr) throw rErr;
          if (qErr) throw qErr;
          if (oErr) throw oErr;

          enrollmentsCount = (enrs || []).length;
          reviewsPending = (revs || []).filter((r) => !r.response).length;
          qaPending = (qs || []).filter((q) => !q.answer).length;
          totalEarnings = (ordersAgg || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);
        }

        if (!cancelled) {
          setMetrics({
            courses: (courses || []).length,
            enrollments: enrollmentsCount,
            pendingReviews: reviewsPending,
            pendingQuestions: qaPending,
            totalEarnings: Number(totalEarnings.toFixed(2)),
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Instructor dashboard load failed", e);
        if (!cancelled) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const Metric = ({ label, value }) => (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>
        {typeof value === "number" ? value : value}
      </div>
    </div>
  );

  return (
    <div className="container">
      <div
        className="card"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Instructor Dashboard</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Overview of your teaching activity
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" to="/instructor/create">Create Course</Link>
          <Link className="btn" to="/instructor/courses">Manage Courses</Link>
          <Link className="btn" to="/instructor/earnings">Earnings</Link>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading instructor metrics...</div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <Metric label="Courses" value={metrics.courses} />
            <Metric label="Total Enrollments" value={metrics.enrollments} />
            <Metric label="Pending Reviews" value={metrics.pendingReviews} />
            <Metric label="Pending Questions" value={metrics.pendingQuestions} />
            <Metric label="Total Earnings ($)" value={`$${metrics.totalEarnings.toFixed?.(2) ?? metrics.totalEarnings}` } />
          </div>
        </>
      )}
    </div>
  );
}
