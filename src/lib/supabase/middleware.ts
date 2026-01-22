/**
 * Supabase Middleware Client
 * 
 * Only refreshes cookies - NO auth checks on every request
 * Auth is handled client-side for speed and reliability
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  // Create Supabase client just to handle cookie refresh
  // This does NOT make network calls - it only manages local cookies
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // DO NOT call getUser() here - it's slow and unnecessary
  // Client-side auth handles everything

  return response;
}
