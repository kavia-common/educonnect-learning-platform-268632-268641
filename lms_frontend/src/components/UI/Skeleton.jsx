import React from "react";

/**
 * PUBLIC_INTERFACE
 * Skeleton: Simple loading placeholder blocks.
 * Usage: <Skeleton width={200} height={16} /> or <Skeleton.Text lines={3} />
 */
export default function Skeleton({ width = "100%", height = 16, rounded = 8, style = {} }) {
  /** Render a single skeleton block rectangle. */
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: rounded,
        background:
          "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)",
        backgroundSize: "400% 100%",
        animation: "skeleton-loading 1.4s ease infinite",
        ...style,
      }}
    />
  );
}

// PUBLIC_INTERFACE
Skeleton.Text = function Text({ lines = 3 }) {
  /** Render multiple text-like skeleton lines. */
  const arr = Array.from({ length: Math.max(1, lines) });
  return (
    <div aria-hidden="true" style={{ display: "grid", gap: 8 }}>
      {arr.map((_, idx) => (
        <Skeleton key={idx} width={idx === arr.length - 1 ? "60%" : "100%"} height={14} />
      ))}
    </div>
  );
};

// Keyframes via global style injection (scoped to this component file)
const styleTag = document.createElement("style");
styleTag.innerHTML = `
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;
if (typeof document !== "undefined") {
  document.head.appendChild(styleTag);
}
