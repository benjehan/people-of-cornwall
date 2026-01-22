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
 * Auth hook with logging
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
    console.log('[USE-USER] Client created');
  }

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase || initRef.current) return;
    initRef.current = true;

    let mounted = true;
    console.log('[USE-USER] ====== INIT ======');

    // Fast initial check using getSession (reads cookies, no network)
    const initAuth = async () => {
      try {
        console.log('[USE-USER] Calling getSession...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('[USE-USER] getSession error:', error.message);
        }
        
        if (!mounted) {
          console.log('[USE-USER] Component unmounted, aborting');
          return;
        }
        
        if (session?.user) {
          console.log('[USE-USER] Session found:', session.user.email);
          setState({
            user: session.user,
            profile: null,
            isLoading: false,
            isAdmin: false,
          });

          // Fetch profile in background
          console.log('[USE-USER] Fetching profile...');
          const { data: profile } = await (supabase
            .from("users") as any)
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          if (mounted) {
            console.log('[USE-USER] Profile loaded, admin:', profile?.role === "admin");
            setState({
              user: session.user,
              profile: profile || null,
              isLoading: false,
              isAdmin: profile?.role === "admin",
            });
          }
        } else {
          console.log('[USE-USER] No session found');
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
          });
        }
      } catch (error: any) {
        console.log('[USE-USER] Init error:', error?.message);
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
    console.log('[USE-USER] Setting up auth listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[USE-USER] Auth event:', event);
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          console.log('[USE-USER] Signed out');
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
          });
          return;
        }

        if (session?.user) {
          console.log('[USE-USER] Auth change, user:', session.user.email);
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
      console.log('[USE-USER] Cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    console.log('[USE-USER] Sign out called');
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
