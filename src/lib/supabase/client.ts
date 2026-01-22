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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    console.log('[SUPABASE] Creating client, URL:', url?.substring(0, 30) + '...');
    
    client = createBrowserClient<Database>(url, key);
  }
  
  return client;
}

// Test function to verify Supabase connection
export async function testSupabaseConnection() {
  const supabase = createClient();
  console.log('[SUPABASE] Testing connection...');
  
  const start = Date.now();
  try {
    const { data, error } = await supabase.from('stories').select('count', { count: 'exact', head: true });
    console.log('[SUPABASE] Test result:', { data, error, time: Date.now() - start + 'ms' });
    return !error;
  } catch (e) {
    console.error('[SUPABASE] Test error:', e);
    return false;
  }
}
