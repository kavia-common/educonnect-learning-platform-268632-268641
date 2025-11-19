import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import supabase from "../../supabase/client";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

/**
 * PUBLIC_INTERFACE
 * Student Profile Edit page
 * Allows updating avatar (uploads to Supabase Storage 'avatars' bucket), full_name, about, country.
 */
export default function StudentProfileEdit() {
  /** Render profile edit form with inline validation and avatar upload. */
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState({ full_name: "", about: "", country: "", avatar_url: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const schema = yup.object({
    full_name: yup.string().trim().min(2, "Enter your full name").required("Full name is required"),
    about: yup.string().trim().max(500, "Max 500 characters"),
    country: yup.string().trim().max(60, "Max 60 characters"),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: yupResolver(schema), mode: "onChange", defaultValues: initial });

  // Load profile
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.from("profiles").select("full_name, about, country, avatar_url").eq("id", user.id).maybeSingle();
        if (error) throw error;
        const vals = {
          full_name: data?.full_name || "",
          about: data?.about || "",
          country: data?.country || "",
          avatar_url: data?.avatar_url || "",
        };
        if (!cancelled) {
          setInitial(vals);
          setValue("full_name", vals.full_name);
          setValue("about", vals.about);
          setValue("country", vals.country);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Profile load failed", e);
        toast.error(e.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id, setValue]);

  const uploadAvatar = async (file) => {
    if (!user?.id || !file) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    setUploading(true);
    try {
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = await supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub?.publicUrl || null;
      if (!publicUrl) {
        toast("Avatar uploaded, but public URL unavailable. Check bucket policy.");
      }
      // Update profile with new avatar_url
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (updErr) throw updErr;
      toast.success("Avatar updated");
      setInitial((i) => ({ ...i, avatar_url: publicUrl || "" }));
      return publicUrl;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Avatar upload failed", e);
      toast.error(e.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    // 5MB size limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    await uploadAvatar(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        full_name: values.full_name.trim(),
        about: values.about.trim(),
        country: values.country.trim(),
      };
      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Profile update failed", e);
      toast.error(e.message || "Update failed");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Edit Profile</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>Update your personal details and avatar</p>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading profile...</div>
      ) : (
        <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <section style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div
              aria-label="Current avatar"
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                background: "#e5e7eb",
                overflow: "hidden",
                border: "1px solid #e5e7eb",
              }}
            >
              {initial.avatar_url ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img src={initial.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                  No avatar
                </div>
              )}
            </div>
            <div>
              <label className="btn" htmlFor="avatar-upload" aria-label="Upload avatar" style={{ marginRight: 8 }}>
                {uploading ? "Uploading..." : "Upload avatar"}
              </label>
              <input
                id="avatar-upload"
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={onAvatarChange}
                style={{ display: "none" }}
                disabled={uploading}
              />
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>PNG/JPG up to 5MB.</div>
            </div>
          </section>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "grid", gap: 12 }}>
            <div>
              <label htmlFor="full_name" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Full name
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="Your full name"
                {...register("full_name")}
                style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.full_name ? "var(--color-error)" : "#e5e7eb"}` }}
              />
              {errors.full_name && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.full_name.message}</div>}
            </div>

            <div>
              <label htmlFor="about" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                About
              </label>
              <textarea
                id="about"
                rows={4}
                placeholder="A short bio..."
                {...register("about")}
                style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.about ? "var(--color-error)" : "#e5e7eb"}` }}
              />
              {errors.about && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.about.message}</div>}
            </div>

            <div>
              <label htmlFor="country" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Country
              </label>
              <input
                id="country"
                type="text"
                placeholder="Your country"
                {...register("country")}
                style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.country ? "var(--color-error)" : "#e5e7eb"}` }}
              />
              {errors.country && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.country.message}</div>}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" type="submit" disabled={isSubmitting || uploading}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
