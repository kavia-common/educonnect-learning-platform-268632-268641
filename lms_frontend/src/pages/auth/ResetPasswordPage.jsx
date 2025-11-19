import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import supabase from "../../supabase/client";
import { env } from "../../config/env";

/**
 * PUBLIC_INTERFACE
 * ResetPasswordPage
 * Allows users to request a password reset email via Supabase.
 */
export default function ResetPasswordPage() {
  /** Render reset password form and send reset email. */
  const [formError, setFormError] = useState("");
  const schema = yup.object({
    email: yup.string().email("Enter a valid email").required("Email is required"),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async ({ email }) => {
    setFormError("");
    const redirectTo = (env.FRONTEND_URL || window.location.origin) + "/login";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      setFormError(error.message || "Failed to send reset email");
      return;
    }
    toast.success("Password reset email sent");
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 480, margin: "24px auto" }}>
        <h2 style={{ marginTop: 0 }}>Reset Password</h2>
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          Enter your email and we'll send you a password reset link.
        </p>

        {formError ? (
          <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label htmlFor="email" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  padding: "10px 12px",
                  border: `1px solid ${errors.email ? "var(--color-error)" : "#e5e7eb"}`,
                }}
              />
              {errors.email && (
                <div style={{ color: "var(--color-error)", fontSize: 12, marginTop: 4 }}>
                  {errors.email.message}
                </div>
              )}
            </div>

            <button className="btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>

            <div style={{ textAlign: "center", fontSize: 14 }}>
              <Link className="link" to="/login">Back to login</Link> ·{" "}
              <Link className="link" to="/register">Create an account</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
