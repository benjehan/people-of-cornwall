/**
 * Supabase Client — Browser/Client Components
 * 
 * Use this client in:
 * - Client components ("use client")
 * - Event handlers
 * - useEffect hooks
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
