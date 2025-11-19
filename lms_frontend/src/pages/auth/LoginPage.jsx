import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useAuthStore from "../../store/useAuthStore";

/**
 * PUBLIC_INTERFACE
 * LoginPage
 * A login form using react-hook-form + yup validation, authenticates with Supabase via useAuthStore.
 */
export default function LoginPage() {
  /** Render login form and handle submit to sign in. */
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, status } = useAuthStore();
  const [formError, setFormError] = useState("");

  const schema = yup.object({
    email: yup.string().email("Enter a valid email").required("Email is required"),
    password: yup.string().min(6, "At least 6 characters").required("Password is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (values) => {
    setFormError("");
    const { error } = await signIn(values);
    if (error) {
      setFormError(error.message || "Login failed");
      return;
    }
    const redirectTo = location.state?.from?.pathname || "/student/dashboard";
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 480, margin: "24px auto" }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <p style={{ marginTop: 0, color: "#6b7280" }}>Access your learning dashboard</p>

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

            <div>
              <label htmlFor="password" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Your password"
                {...register("password")}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  padding: "10px 12px",
                  border: `1px solid ${errors.password ? "var(--color-error)" : "#e5e7eb"}`,
                }}
              />
              {errors.password && (
                <div style={{ color: "var(--color-error)", fontSize: 12, marginTop: 4 }}>
                  {errors.password.message}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Link className="link" to="/reset-password">Forgot password?</Link>
            </div>

            <button className="btn" type="submit" disabled={isSubmitting || status === "loading"}>
              {isSubmitting || status === "loading" ? "Signing in..." : "Sign In"}
            </button>

            <div style={{ textAlign: "center", fontSize: 14 }}>
              Don't have an account? <Link className="link" to="/register">Create one</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
