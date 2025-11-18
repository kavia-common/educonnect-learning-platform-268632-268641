"use strict";

/**
 * Environment configuration for the LMS frontend.
 * Validates required env vars provided via CRA using REACT_APP_ prefix.
 */

// PUBLIC_INTERFACE
export function getEnvConfig() {
  /** Return validated environment configuration for the app. */
  const config = {
    SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_KEY,
    API_BASE: process.env.REACT_APP_API_BASE || "",
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL || "",
    FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || "",
    WS_URL: process.env.REACT_APP_WS_URL || "",
    NODE_ENV: process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || "development",
    LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || "info",
    FEATURE_FLAGS: process.env.REACT_APP_FEATURE_FLAGS || "",
    EXPERIMENTS_ENABLED: process.env.REACT_APP_EXPERIMENTS_ENABLED === "true",
  };

  const missing = [];
  if (!config.SUPABASE_URL) missing.push("REACT_APP_SUPABASE_URL");
  if (!config.SUPABASE_ANON_KEY) missing.push("REACT_APP_SUPABASE_KEY");

  if (missing.length > 0) {
    // Do not throw to avoid breaking local UI; warn prominently for developer
    // eslint-disable-next-line no-console
    console.error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Please set them in your .env file. The app may not function properly without them."
    );
  }

  return Object.freeze(config);
}

// PUBLIC_INTERFACE
export const env = getEnvConfig();
