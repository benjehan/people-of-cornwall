"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SetSessionContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Starting...");
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasRun.current) {
      console.log('[SET-SESSION] Already ran, skipping');
      return;
    }
    hasRun.current = true;

    console.log('[SET-SESSION] ====== START ======');

    const setSession = async () => {
      try {
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");
        const next = searchParams.get("next") || "/";

        console.log('[SET-SESSION] Access token present:', !!accessToken);
        console.log('[SET-SESSION] Refresh token present:', !!refreshToken);
        console.log('[SET-SESSION] Next path:', next);

        if (!accessToken || !refreshToken) {
          console.log('[SET-SESSION] ERROR: Missing tokens');
          setError("Missing tokens");
          setStatus("Error: Missing tokens");
          return;
        }

        setStatus("Creating Supabase client...");
        console.log('[SET-SESSION] Creating client...');
        const supabase = createClient();

        setStatus("Setting session...");
        console.log('[SET-SESSION] Calling setSession...');
        
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.log('[SET-SESSION] ERROR:', sessionError.message);
          setError(sessionError.message);
          setStatus("Error: " + sessionError.message);
          return;
        }

        console.log('[SET-SESSION] Session set successfully!');
        console.log('[SET-SESSION] User:', data.user?.email);
        
        setStatus("Session set! Redirecting...");

        // Verify session was set
        const { data: verifyData } = await supabase.auth.getSession();
        console.log('[SET-SESSION] Verify session:', !!verifyData.session);

        console.log('[SET-SESSION] Redirecting to:', next);
        console.log('[SET-SESSION] ====== END ======');
        
        // Use replace to avoid back button issues
        window.location.replace(next);
      } catch (err: any) {
        console.log('[SET-SESSION] CATCH ERROR:', err?.message || err);
        setError(err?.message || "Unknown error");
        setStatus("Error: " + (err?.message || "Unknown"));
      }
    };

    setSession();
  }, [searchParams]);

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4 text-lg">❌ {error}</p>
        <p className="text-stone mb-4">Status: {status}</p>
        <a href="/login" className="text-granite underline hover:no-underline">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-bone border-t-granite"></div>
      <p className="text-granite font-medium">{status}</p>
      <p className="text-stone text-sm mt-2">Check browser console for logs</p>
    </div>
  );
}

export default function SetSessionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment">
      <Suspense fallback={
        <div className="text-center p-8">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-bone border-t-granite"></div>
          <p className="text-stone">Loading...</p>
        </div>
      }>
        <SetSessionContent />
      </Suspense>
    </div>
  );
}
