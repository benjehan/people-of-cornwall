"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SetSessionContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasRun.current) return;
    hasRun.current = true;

    const setSession = async () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const next = searchParams.get("next") || "/";

      if (!accessToken || !refreshToken) {
        setError("Missing tokens");
        setStatus("error");
        return;
      }

      try {
        const supabase = createClient();

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error("Failed to set session:", sessionError);
          setError(sessionError.message);
          setStatus("error");
          return;
        }

        setStatus("success");
        
        // Small delay to ensure session is fully set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Hard redirect to force full page reload with new session
        window.location.replace(next);
      } catch (err) {
        console.error("Session error:", err);
        setError("Failed to sign in");
        setStatus("error");
      }
    };

    setSession();
  }, [searchParams]);

  if (status === "error") {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <a href="/login" className="text-granite underline hover:no-underline">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-bone border-t-granite"></div>
      <p className="text-stone">
        {status === "success" ? "Redirecting..." : "Signing you in..."}
      </p>
    </div>
  );
}

export default function SetSessionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment">
      <Suspense fallback={
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-bone border-t-granite"></div>
          <p className="text-stone">Loading...</p>
        </div>
      }>
        <SetSessionContent />
      </Suspense>
    </div>
  );
}
