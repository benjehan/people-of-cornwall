/**
 * Supabase Middleware Client
 * 
 * Refreshes the user's session on every request
 * Note: Auth redirects are now handled client-side for better reliability
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Just refresh the session - don't redirect
  // Auth protection is handled client-side for better reliability
  try {
    await supabase.auth.getUser();
  } catch (error) {
    // Silently fail - client will handle auth
    console.error("Middleware auth refresh error:", error);
  }

  return supabaseResponse;
}
