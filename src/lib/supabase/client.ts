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

// Singleton client instance for browser
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // Return existing instance if available (browser only)
  if (typeof window !== "undefined" && clientInstance) {
    return clientInstance;
  }

  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Store instance in browser
  if (typeof window !== "undefined") {
    clientInstance = client;
  }

  return client;
}
