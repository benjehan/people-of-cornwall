"use client";

import { useEffect, useState, useCallback } from "react";
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

// Get the singleton client
const supabase = typeof window !== "undefined" ? createClient() : null;

/**
 * Hook to get the current authenticated user and their profile
 */
export function useUser() {
  const [state, setState] = useState<UserState>({
    user: null,
    profile: null,
    isLoading: true,
    profileChecked: false,
    isAdmin: false,
  });

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    
    try {
      const { data: profile } = await (supabase
        .from("users") as any)
        .select("*")
        .eq("id", userId)
        .single();
      return profile as Profile | null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
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

    // Safety timeout to prevent infinite loading (8 seconds max)
    const timeout = setTimeout(() => {
      if (mounted) {
        setState(prev => {
          if (prev.isLoading) {
            console.warn("Auth loading timeout - falling back to unauthenticated state");
            return {
              user: null,
              profile: null,
              isLoading: false,
              profileChecked: true,
              isAdmin: false,
            };
          }
          return prev;
        });
      }
    }, 8000);

    const getInitialSession = async () => {
      try {
        // Use getSession for faster initial load
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
        }

        if (!mounted) return;

        if (session?.user) {
          // Set user immediately, then fetch profile
          setState(prev => ({
            ...prev,
            user: session.user,
            isLoading: false,
          }));

          // Fetch profile in background (with timeout)
          const profilePromise = fetchProfile(session.user.id);
          const profile = await Promise.race([
            profilePromise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
          ]);
          
          if (mounted) {
            setState({
              user: session.user,
              profile: profile || null,
              isLoading: false,
              profileChecked: true,
              isAdmin: profile?.role === "admin",
            });
          }
        } else {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            profileChecked: true,
            isAdmin: false,
          });
        }
      } catch (error) {
        console.error("Error getting session:", error);
        if (mounted) {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            profileChecked: true,
            isAdmin: false,
          });
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
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
        // Update user immediately
        setState(prev => ({
          ...prev,
          user: session.user,
          isLoading: false,
        }));

        // Fetch profile
        const profile = await fetchProfile(session.user.id);
        if (mounted) {
          setState({
            user: session.user,
            profile: profile || null,
            isLoading: false,
            profileChecked: true,
            isAdmin: profile?.role === "admin",
          });
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
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
