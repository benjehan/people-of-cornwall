"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SetSessionContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setSession = async () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const next = searchParams.get("next") || "/";

      if (!accessToken || !refreshToken) {
        setError("Missing tokens");
        return;
      }

      const supabase = createClient();

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("Failed to set session:", error);
        setError(error.message);
        return;
      }

      // Hard redirect to force full page reload with new session
      window.location.href = next;
    };

    setSession();
  }, [searchParams]);

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600">Error: {error}</p>
        <a href="/login" className="text-atlantic-blue underline">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-atlantic-blue"></div>
      <p className="text-slate-grey">Signing you in...</p>
    </div>
  );
}

export default function SetSessionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-chalk-white">
      <Suspense fallback={
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-atlantic-blue"></div>
          <p className="text-slate-grey">Loading...</p>
        </div>
      }>
        <SetSessionContent />
      </Suspense>
    </div>
  );
}
