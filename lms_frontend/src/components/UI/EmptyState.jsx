import React from "react";
import { Link } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * EmptyState: Consistent empty result/info presentation with optional action.
 */
export default function EmptyState({
  title = "Nothing to show",
  description = "There is currently no data available.",
  actionLabel,
  to,
  onAction,
  ariaLabel = "Empty state",
}) {
  /** Render an empty state panel with optional primary action. */
  return (
    <section
      className="card"
      role="status"
      aria-label={ariaLabel}
      style={{ textAlign: "center", padding: 24 }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ marginTop: 4, color: "#6b7280" }}>{description}</p>
      {actionLabel &&
        (to ? (
          <Link className="btn" to={to} aria-label={actionLabel}>
            {actionLabel}
          </Link>
        ) : (
          <button className="btn" onClick={onAction} aria-label={actionLabel}>
            {actionLabel}
          </button>
        ))}
    </section>
  );
}
