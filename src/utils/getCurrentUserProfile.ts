import { createClient } from "@supabase/supabase-js";

// ✅ Use Vite environment variables (equivalent to NEXT_PUBLIC_* in Next.js)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export interface UserProfile {
  id?: string;
  user_id: string;
  email?: string;
  role: 'user' | 'premium' | 'admin';
  subscription_tier?: 'basic' | 'premium' | 'enterprise' | 'free' | 'monthly';
  subscription_status?: 'active' | 'inactive' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/**
 * Get current user profile with safe error handling
 * Based on best practices for reliable user profile fetching
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    // 1️⃣ Check if there's a session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session fetch error:", sessionError.message);
      return null; // fail gracefully
    }

    // 2️⃣ If no logged-in user, return null (no crash)
    if (!session?.user) {
      return null;
    }

    // 3️⃣ Fetch the profile from Supabase
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError.message);
      return null;
    }

    return profile;
  } catch (err) {
    console.error("Unexpected error in getCurrentUserProfile:", err);
    return null;
  }
}

/**
 * Check if current user is premium
 */
export async function isCurrentUserPremium(): Promise<boolean> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return false;

    return profile.subscription_tier === 'premium' ||
           profile.subscription_tier === 'monthly' ||
           profile.role === 'admin';
  } catch (err) {
    console.error("Error checking premium status:", err);
    return false;
  }
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return false;

    return profile.role === 'admin';
  } catch (err) {
    console.error("Error checking admin status:", err);
    return false;
  }
}

/**
 * Get current user session safely
 */
export async function getCurrentSession() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session fetch error:", sessionError.message);
      return null;
    }

    return session;
  } catch (err) {
    console.error("Unexpected error in getCurrentSession:", err);
    return null;
  }
}
