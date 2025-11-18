import create from "zustand";
import { devtools } from "zustand/middleware";
import supabase from "../supabase/client";
import { toast } from "react-hot-toast";

/**
 * Shape of profile expected from Supabase 'profiles' table:
 * { id, email, full_name, avatar_url, role: 'student' | 'instructor' | 'admin', created_at, updated_at }
 */

async function fetchProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load profile:", error);
    return null;
  }
  return data || null;
}

const initialState = {
  user: null,
  profile: null,
  status: "idle", // 'idle' | 'loading' | 'authenticated' | 'error'
  error: null,
};

// PUBLIC_INTERFACE
export const useAuthStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      // PUBLIC_INTERFACE
      async initialize() {
        /** Initialize auth store: recover session and subscribe to changes. */
        set({ status: "loading", error: null });
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          set({ status: "error", error });
          return;
        }
        const user = session?.user || null;
        let profile = null;
        if (user) {
          profile = await fetchProfile(user.id);
        }
        set({
          user,
          profile,
          status: user ? "authenticated" : "idle",
          error: null,
        });

        // Subscribe to auth state changes
        supabase.auth.onAuthStateChange(async (_event, newSession) => {
          const newUser = newSession?.user || null;
          let newProfile = null;
          if (newUser) {
            newProfile = await fetchProfile(newUser.id);
          }
          set({
            user: newUser,
            profile: newProfile,
            status: newUser ? "authenticated" : "idle",
            error: null,
          });
        });
      },

      // PUBLIC_INTERFACE
      async signIn({ email, password }) {
        /** Sign in using email/password via Supabase. */
        set({ status: "loading", error: null });
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          toast.error(error.message || "Sign in failed");
          set({ status: "error", error });
          return { user: null, error };
        }
        const user = data?.user ?? null;
        const profile = user ? await fetchProfile(user.id) : null;
        set({ user, profile, status: "authenticated", error: null });
        toast.success("Signed in successfully");
        return { user, error: null };
      },

      // PUBLIC_INTERFACE
      async signUp({ email, password, full_name }) {
        /**
         * Sign up a new user; expect email confirmation depending on Supabase settings.
         * A profile row should be created by a DB trigger or via Row Level Security policies.
         */
        set({ status: "loading", error: null });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              (process.env.REACT_APP_FRONTEND_URL || window.location.origin) +
              "/login",
            data: { full_name },
          },
        });
        if (error) {
          toast.error(error.message || "Registration failed");
          set({ status: "error", error });
          return { user: null, error };
        }
        const user = data?.user ?? null;
        let profile = null;
        if (user) {
          profile = await fetchProfile(user.id);
        }
        set({ user, profile, status: user ? "authenticated" : "idle", error: null });
        toast.success("Account created. Please verify your email if required.");
        return { user, error: null };
      },

      // PUBLIC_INTERFACE
      async signOut() {
        /** Sign out the current user. */
        const { error } = await supabase.auth.signOut();
        if (error) {
          toast.error(error.message || "Sign out failed");
          return { error };
        }
        set({ ...initialState });
        toast.success("Signed out");
        return { error: null };
      },
    }),
    { name: "auth-store" }
  )
);

export default useAuthStore;
