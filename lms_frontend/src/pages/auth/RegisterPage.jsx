import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import supabase from "../../supabase/client";

/**
 * PUBLIC_INTERFACE
 * RegisterPage
 * Registration form with Supabase signup and profile creation (role=student).
 */
export default function RegisterPage() {
  /** Render registration form and handle sign up + profile creation. */
  const navigate = useNavigate();
  const { signUp, status } = useAuthStore();
  const [formError, setFormError] = useState("");

  const schema = yup.object({
    full_name: yup.string().trim().min(2, "Please enter your full name").required("Full name is required"),
    email: yup.string().email("Enter a valid email").required("Email is required"),
    password: yup.string().min(6, "At least 6 characters").required("Password is required"),
    confirm_password: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords do not match")
      .required("Confirm your password"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const ensureProfile = async (user, full_name, email) => {
    if (!user?.id) return;
    // Try to fetch profile; if missing, create one with role=student
    const { data: existing, error: fetchErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (fetchErr) {
      // eslint-disable-next-line no-console
      console.error("Failed checking existing profile", fetchErr);
    }
    if (!existing) {
      const { error: insertErr } = await supabase.from("profiles").insert([
        {
          id: user.id,
          email,
          full_name,
          role: "student",
        },
      ]);
      if (insertErr) {
        // eslint-disable-next-line no-console
        console.error("Failed creating profile", insertErr);
      }
    }
  };

  const onSubmit = async (values) => {
    setFormError("");
    const { user, error } = await signUp({
      email: values.email,
      password: values.password,
      full_name: values.full_name,
    });
    if (error) {
      setFormError(error.message || "Registration failed");
      return;
    }
    // Create profile row proactively (in case there's no DB trigger)
    try {
      await ensureProfile(user, values.full_name, values.email);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Profile creation error:", e);
    }
    toast.success("Account created! Please check your email if confirmation is required.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "24px auto" }}>
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        <p style={{ marginTop: 0, color: "#6b7280" }}>Join as a student to start learning</p>

        {formError ? (
          <div role="alert" aria-live="assertive" style={{ background: "#FEF2F2", color: "#B91C1C", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label htmlFor="full_name" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Full name
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="Jane Doe"
                aria-invalid={!!errors.full_name}
                aria-describedby={errors.full_name ? "full_name-error" : undefined}
                {...register("full_name")}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  padding: "10px 12px",
                  border: `1px solid ${errors.full_name ? "var(--color-error)" : "#e5e7eb"}`,
                }}
              />
              {errors.full_name && (
                <div id="full_name-error" role="alert" aria-live="assertive" style={{ color: "var(--color-error)", fontSize: 12, marginTop: 4 }}>
                  {errors.full_name.message}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="email" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  padding: "10px 12px",
                  border: `1px solid ${errors.email ? "var(--color-error)" : "#e5e7eb"}`,
                }}
              />
              {errors.email && (
                <div id="email-error" role="alert" aria-live="assertive" style={{ color: "var(--color-error)", fontSize: 12, marginTop: 4 }}>
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
                placeholder="Create a password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  padding: "10px 12px",
                  border: `1px solid ${errors.password ? "var(--color-error)" : "#e5e7eb"}`,
                }}
              />
              {errors.password && (
                <div id="password-error" role="alert" aria-live="assertive" style={{ color: "var(--color-error)", fontSize: 12, marginTop: 4 }}>
                  {errors.password.message}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm_password" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Confirm Password
              </label>
              <input
                id="confirm_password"
                type="password"
                placeholder="Re-enter your password"
                aria-invalid={!!errors.confirm_password}
                aria-describedby={errors.confirm_password ? "confirm_password-error" : undefined}
                {...register("confirm_password")}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  padding: "10px 12px",
                  border: `1px solid ${errors.confirm_password ? "var(--color-error)" : "#e5e7eb"}`,
                }}
              />
              {errors.confirm_password && (
                <div id="confirm_password-error" role="alert" aria-live="assertive" style={{ color: "var(--color-error)", fontSize: 12, marginTop: 4 }}>
                  {errors.confirm_password.message}
                </div>
              )}
            </div>

            <button className="btn" type="submit" disabled={isSubmitting || status === "loading"}>
              {isSubmitting || status === "loading" ? "Creating account..." : "Create Account"}
            </button>

            <div style={{ textAlign: "center", fontSize: 14 }}>
              Already have an account? <Link className="link" to="/login">Sign in</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
