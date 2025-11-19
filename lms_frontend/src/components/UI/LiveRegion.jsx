import React from "react";

/**
 * PUBLIC_INTERFACE
 * LiveRegion: Screen-reader only aria-live region for updates.
 */
export default function LiveRegion({
  children,
  assertive = false,
  id = "app-live-region",
}) {
  /** Render an aria-live region for SR announcements. */
  return (
    <div
      id={id}
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        margin: -1,
        border: 0,
        padding: 0,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
      }}
    >
      {children || null}
    </div>
  );
}
