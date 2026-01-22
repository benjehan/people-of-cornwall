"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/types/supabase";

type Profile = Tables<"users">;

interface UserState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

/**
 * Fast, reliable auth hook
 * Uses getSession() for speed (reads from cookies, no network call)
 */
export function useUser() {
  const [state, setState] = useState<UserState>({
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
  });

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const initRef = useRef(false);

  // Initialize client once
  if (typeof window !== "undefined" && !supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase || initRef.current) return;
    initRef.current = true;

    let mounted = true;

    // Fast initial check using getSession (reads cookies, no network)
    const initAuth = async () => {
      try {
        // getSession is FAST - it reads from local storage/cookies
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          setState({
            user: session.user,
            profile: null,
            isLoading: false,
            isAdmin: false,
          });

          // Fetch profile in background (non-blocking)
          const { data: profile } = await (supabase
            .from("users") as any)
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          if (mounted) {
            setState({
              user: session.user,
              profile: profile || null,
              isLoading: false,
              isAdmin: profile?.role === "admin",
            });
          }
        } else {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
          });
        }
      } catch (error) {
        console.error("Auth init error:", error);
        if (mounted) {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
          });
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
          });
          return;
        }

        if (session?.user) {
          setState(prev => ({
            ...prev,
            user: session.user,
            isLoading: false,
          }));

          // Fetch profile
          const { data: profile } = await (supabase
            .from("users") as any)
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          if (mounted) {
            setState({
              user: session.user,
              profile: profile || null,
              isLoading: false,
              isAdmin: profile?.role === "admin",
            });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabaseRef.current) return;
    
    await supabaseRef.current.auth.signOut();
    setState({
      user: null,
      profile: null,
      isLoading: false,
      isAdmin: false,
    });
  }, []);

  return {
    ...state,
    signOut,
  };
}

/**
 * Get display name from user or profile
 */
export function getDisplayName(user: User | null, profile: Profile | null): string {
  if (profile?.display_name) return profile.display_name;
  if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
  if (user?.user_metadata?.name) return user.user_metadata.name;
  if (user?.email) return user.email.split("@")[0];
  return "User";
}

/**
 * Get avatar URL from user or profile
 */
export function getAvatarUrl(user: User | null, profile: Profile | null): string | null {
  if (profile?.avatar_url) return profile.avatar_url;
  if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
  if (user?.user_metadata?.picture) return user.user_metadata.picture;
  return null;
}
