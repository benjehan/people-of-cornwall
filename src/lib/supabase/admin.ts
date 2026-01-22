/**
 * Supabase Admin Client
 * 
 * Uses the service role key for admin-only operations like
 * looking up user emails for notifications.
 * 
 * NEVER use this client in client-side code!
 */

import { createClient } from "@supabase/supabase-js";

// This client has full access - only use server-side for admin operations
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[Admin Client] Service role key not configured");
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get user email by ID (admin only)
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) {
      console.warn("[Admin Client] Could not get user email:", error?.message);
      return null;
    }
    return data.user.email;
  } catch (err) {
    console.error("[Admin Client] Error getting user email:", err);
    return null;
  }
}
