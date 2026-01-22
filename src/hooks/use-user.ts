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
  profileChecked: boolean;
  isAdmin: boolean;
}

/**
 * Bulletproof auth hook
 * Uses onAuthStateChange as the primary source of truth
 */
export function useUser() {
  const [state, setState] = useState<UserState>({
    user: null,
    profile: null,
    isLoading: true,
    profileChecked: false,
    isAdmin: false,
  });

  // Track if we've received any auth event
  const hasReceivedAuthEvent = useRef(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Initialize client once
  if (typeof window !== "undefined" && !supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabaseRef.current) return null;
    
    try {
      const { data } = await (supabaseRef.current
        .from("users") as any)
        .select("*")
        .eq("id", userId)
        .single();
      return data as Profile | null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase) {
      setState({
        user: null,
        profile: null,
        isLoading: false,
        profileChecked: true,
        isAdmin: false,
      });
      return;
    }

    let mounted = true;

    // The auth state change listener is the PRIMARY source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        hasReceivedAuthEvent.current = true;

        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            profileChecked: true,
            isAdmin: false,
          });
          return;
        }

        if (session?.user) {
          // Immediately update with user
          setState(prev => ({
            ...prev,
            user: session.user,
            isLoading: false,
          }));

          // Fetch profile in background
          const profile = await fetchProfile(session.user.id);
          if (mounted) {
            setState(prev => ({
              ...prev,
              user: session.user, // Keep user in case state was reset
              profile: profile || null,
              profileChecked: true,
              isAdmin: profile?.role === "admin",
              isLoading: false,
            }));
          }
        } else {
          // No session
          setState({
            user: null,
            profile: null,
            isLoading: false,
            profileChecked: true,
            isAdmin: false,
          });
        }
      }
    );

    // Also do an immediate session check as a backup
    // This handles the case where we already have a session on page load
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        // Only use this if we haven't received an auth event yet
        if (!hasReceivedAuthEvent.current) {
          if (session?.user) {
            setState(prev => ({
              ...prev,
              user: session.user,
              isLoading: false,
            }));

            const profile = await fetchProfile(session.user.id);
            if (mounted && !hasReceivedAuthEvent.current) {
              setState(prev => ({
                ...prev,
                user: session.user,
                profile: profile || null,
                profileChecked: true,
                isAdmin: profile?.role === "admin",
                isLoading: false,
              }));
            }
          } else {
            // No session found, but wait a bit for auth event
            setTimeout(() => {
              if (mounted && !hasReceivedAuthEvent.current) {
                setState(prev => {
                  // Only update if still loading
                  if (prev.isLoading) {
                    return {
                      ...prev,
                      isLoading: false,
                      profileChecked: true,
                    };
                  }
                  return prev;
                });
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted && !hasReceivedAuthEvent.current) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            profileChecked: true,
          }));
        }
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    if (!supabaseRef.current) return;
    
    await supabaseRef.current.auth.signOut();
    setState({
      user: null,
      profile: null,
      isLoading: false,
      profileChecked: true,
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
