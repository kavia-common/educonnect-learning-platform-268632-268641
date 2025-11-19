import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import supabase from "../../supabase/client";
import { toast } from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

/**
 * PUBLIC_INTERFACE
 * Instructor Create Course
 * Form fields: Title, Description, Price, Category, Language, Skills array, Lectures outline, Publish toggle
 */
export default function InstructorCreateCourse() {
  /** Render course creation form and handle save/publish. */
  const { user } = useAuthStore();
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const schema = yup.object({
    title: yup.string().trim().min(3, "Enter a title").required("Title is required"),
    description: yup.string().trim().min(10, "Description too short").required("Description is required"),
    price: yup.number().typeError("Enter a valid price").min(0, "Price cannot be negative").required("Price is required"),
    category: yup.string().trim().required("Category is required"),
    language: yup.string().trim().required("Language is required"),
    skills: yup.array().of(yup.string().trim().min(1, "Skill cannot be empty")).max(20, "Max 20 skills"),
    lectures: yup.array().of(
      yup.object({
        title: yup.string().trim().min(2, "Lecture title too short").required("Lecture title is required"),
        summary: yup.string().trim().max(200, "Max 200 characters"),
      })
    ).max(200, "Too many lectures"),
    published: yup.boolean(),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      category: "",
      language: "English",
      skills: [""],
      lectures: [{ title: "", summary: "" }],
      published: false,
    },
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: "skills",
  });

  const { fields: lectureFields, append: appendLecture, remove: removeLecture } = useFieldArray({
    control,
    name: "lectures",
  });

  const onSubmit = async (values) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        price: Number(values.price || 0),
        category: values.category.trim(),
        language: values.language.trim(),
        skills: (values.skills || []).filter((s) => (s || "").trim()).slice(0, 20),
        instructor_id: user.id,
        published: Boolean(values.published),
      };

      const { data: course, error } = await supabase.from("courses").insert([payload]).select().single();
      if (error) throw error;

      // Insert lectures outline into course_curriculum as outline items (optional)
      const outline = (values.lectures || []).filter((l) => (l?.title || "").trim());
      if (outline.length) {
        const rows = outline.map((l, idx) => ({
          course_id: course.id,
          title: (l.title || "").trim(),
          summary: (l.summary || "").trim(),
          order_index: idx + 1,
        }));
        const { error: curErr } = await supabase.from("course_curriculum").insert(rows);
        if (curErr) {
          // eslint-disable-next-line no-console
          console.error("Failed to save outline", curErr);
        }
      }

      toast.success(values.published ? "Course created and published" : "Course saved as draft");
      reset();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Create course failed", e);
      setFormError(e.message || "Failed to create course");
      toast.error(e.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Create a new course</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Enter the course details and optionally publish immediately
          </p>
        </div>
      </div>

      {formError ? (
        <div className="card" style={{ background: "#FEF2F2", color: "#7F1D1D" }}>
          <strong>Error:</strong> {formError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <div>
            <label htmlFor="title" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Title</label>
            <input
              id="title"
              type="text"
              placeholder="Mastering React"
              {...register("title")}
              style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.title ? "var(--color-error)" : "#e5e7eb"}` }}
            />
            {errors.title && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.title.message}</div>}
          </div>

          <div>
            <label htmlFor="description" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Description</label>
            <textarea
              id="description"
              rows={5}
              placeholder="Describe what students will learn..."
              {...register("description")}
              style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.description ? "var(--color-error)" : "#e5e7eb"}` }}
            />
            {errors.description && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.description.message}</div>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label htmlFor="price" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Price (USD)</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("price")}
                style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.price ? "var(--color-error)" : "#e5e7eb"}` }}
              />
              {errors.price && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.price.message}</div>}
            </div>

            <div>
              <label htmlFor="category" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Category</label>
              <input
                id="category"
                type="text"
                placeholder="Web Development"
                {...register("category")}
                style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.category ? "var(--color-error)" : "#e5e7eb"}` }}
              />
              {errors.category && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.category.message}</div>}
            </div>

            <div>
              <label htmlFor="language" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Language</label>
              <input
                id="language"
                type="text"
                placeholder="English"
                {...register("language")}
                style={{ width: "100%", borderRadius: 10, padding: "10px 12px", border: `1px solid ${errors.language ? "var(--color-error)" : "#e5e7eb"}` }}
              />
              {errors.language && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.language.message}</div>}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontWeight: 700 }}>Skills (one per line)</label>
              <button
                className="btn"
                type="button"
                onClick={() => appendSkill("")}
                aria-label="Add skill"
              >
                Add skill
              </button>
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {skillFields.map((field, index) => (
                <div key={field.id} style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="e.g., React Hooks"
                    {...register(`skills.${index}`)}
                    style={{ flex: 1, borderRadius: 10, padding: "10px 12px", border: "1px solid #e5e7eb" }}
                  />
                  <button
                    className="btn"
                    type="button"
                    onClick={() => removeSkill(index)}
                    style={{ background: "#EF4444" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {errors.skills && typeof errors.skills.message === "string" && (
              <div style={{ color: "var(--color-error)", fontSize: 12 }}>{errors.skills.message}</div>
            )}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontWeight: 700 }}>Lectures outline</label>
              <button
                className="btn"
                type="button"
                onClick={() => appendLecture({ title: "", summary: "" })}
                aria-label="Add lecture"
              >
                Add lecture
              </button>
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
              {lectureFields.map((field, idx) => (
                <div key={field.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#6b7280" }}>Title</label>
                      <input
                        type="text"
                        placeholder={`Lecture ${idx + 1} title`}
                        {...register(`lectures.${idx}.title`)}
                        style={{ width: "100%", borderRadius: 10, padding: "8px 10px", border: "1px solid #e5e7eb" }}
                      />
                      {errors.lectures?.[idx]?.title && (
                        <div style={{ color: "var(--color-error)", fontSize: 12 }}>
                          {errors.lectures[idx].title.message}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#6b7280" }}>Summary (optional)</label>
                      <input
                        type="text"
                        placeholder="Short summary"
                        {...register(`lectures.${idx}.summary`)}
                        style={{ width: "100%", borderRadius: 10, padding: "8px 10px", border: "1px solid #e5e7eb" }}
                      />
                      {errors.lectures?.[idx]?.summary && (
                        <div style={{ color: "var(--color-error)", fontSize: 12 }}>
                          {errors.lectures[idx].summary.message}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => removeLecture(idx)}
                        style={{ background: "#EF4444" }}
                      >
                        Remove Lecture
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" {...register("published")} />
              <span>Publish now</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="submit" disabled={isSubmitting || saving}>
              {isSubmitting || saving ? "Saving..." : "Save & Publish (if toggled)"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
