import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

/**
 * PUBLIC_INTERFACE
 * Student Q&A page
 * Lists user's questions and allows submitting new question for a course.
 */
export default function StudentQA() {
  /** Render user Q&A list and submit form. */
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [qa, setQa] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  const schema = yup.object({
    course_id: yup.number().typeError("Select a course").required("Course is required"),
    question: yup.string().trim().min(5, "Question too short").required("Question is required"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema), mode: "onChange" });

  const loadAll = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const [{ data: enr, error: enrErr }, { data: qaData, error: qaErr }] = await Promise.all([
        supabase
          .from("enrollments")
          .select("course_id, courses:course_id (title)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("enrolled_at", { ascending: false }),
        supabase
          .from("qa")
          .select("id, course_id, question, answer, created_at, courses:course_id (title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (enrErr) throw enrErr;
      if (qaErr) throw qaErr;
      setCourses(enr || []);
      setQa(qaData || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("QA load failed", e);
      setError(e.message || "Failed to load Q&A");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        user_id: user.id,
        course_id: Number(values.course_id),
        question: values.question.trim(),
      };
      const { error } = await supabase.from("qa").insert([payload]);
      if (error) throw error;
      toast.success("Question submitted");
      reset({ question: "" });
      await loadAll();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Submit question failed", e);
      toast.error(e.message || "Submit failed");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Q&A</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>Ask questions and view responses</p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">Loading Q&A...</div>
      ) : (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Ask a question</h3>
            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "grid", gap: 10 }}>
              <div>
                <label htmlFor="course_id" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                  Course
                </label>
                <select
                  id="course_id"
                  {...register("course_id")}
                  style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.course_id ? "var(--color-error)" : "#e5e7eb"}` }}
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>{c.courses?.title || `Course #${c.course_id}`}</option>
                  ))}
                </select>
                {errors.course_id && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.course_id.message}</div>}
              </div>
              <div>
                <label htmlFor="question" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                  Question
                </label>
                <textarea
                  id="question"
                  rows={3}
                  placeholder="Type your question..."
                  {...register("question")}
                  style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.question ? "var(--color-error)" : "#e5e7eb"}` }}
                />
                {errors.question && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.question.message}</div>}
              </div>
              <div>
                <button className="btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>

          <div className="card" style={{ display: "grid", gap: 8 }}>
            <h3 style={{ marginTop: 0 }}>Your questions</h3>
            {qa.length === 0 ? (
              <div>No questions yet.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {qa.map((q) => (
                  <li key={q.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                    <div style={{ fontWeight: 700 }}>
                      {q.courses?.title ? `${q.courses.title} — ` : ""}Q: {q.question}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 700 }}>A: </span>
                      <span>{q.answer || "Not answered yet."}</span>
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>{new Date(q.created_at).toLocaleString()}</div>
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
