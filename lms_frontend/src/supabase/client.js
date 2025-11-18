import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

/**
 * Singleton Supabase client for the LMS app.
 * Uses anon key and URL from environment configuration.
 */

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns the initialized Supabase client instance. */
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    // Fallback client with empty config to avoid crashes if misconfigured
    // eslint-disable-next-line no-console
    console.warn("Supabase environment is not fully configured.");
  }
  return createClient(env.SUPABASE_URL || "", env.SUPABASE_ANON_KEY || "", {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-client-info": "LMS-Frontend",
      },
    },
  });
}

const supabase = getSupabaseClient();
export default supabase;
