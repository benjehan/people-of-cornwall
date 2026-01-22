import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// SINGLETON - one client for the entire app
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (typeof window === "undefined") {
    // Server-side - create new each time (will be thrown away)
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  // Client-side - reuse singleton
  if (!client) {
    console.log('[SUPABASE] Creating singleton client');
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  return client;
}
