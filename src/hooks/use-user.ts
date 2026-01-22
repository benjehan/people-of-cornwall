"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
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
 * Hook to get the current authenticated user and their profile
 * Uses a more reliable approach with immediate session check
 */
export function useUser() {
  const [state, setState] = useState<UserState>({
    user: null,
    profile: null,
    isLoading: true,
    profileChecked: false,
    isAdmin: false,
  });

  const [supabase] = useState(() => 
    typeof window !== "undefined" ? createClient() : null
  );

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
  }, [supabase]);

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
    let timeoutId: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        // Try to get the session - this reads from cookies/storage
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Session error:", error.message);
        }

        if (session?.user) {
          // User is authenticated
          setState(prev => ({
            ...prev,
            user: session.user,
            isLoading: false,
          }));

          // Fetch profile (non-blocking)
          fetchProfile(session.user.id).then(profile => {
            if (mounted) {
              setState(prev => ({
                ...prev,
                profile: profile || null,
                profileChecked: true,
                isAdmin: profile?.role === "admin",
              }));
            }
          });
        } else {
          // No session found
          setState({
            user: null,
            profile: null,
            isLoading: false,
            profileChecked: true,
            isAdmin: false,
          });
        }
      } catch (error) {
        console.error("Auth check error:", error);
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

    // Start auth check immediately
    checkAuth();

    // Safety timeout - but much shorter now (3 seconds)
    timeoutId = setTimeout(() => {
      if (mounted) {
        setState(prev => {
          if (prev.isLoading) {
            console.warn("Auth loading timeout");
            return {
              ...prev,
              isLoading: false,
              profileChecked: true,
            };
          }
          return prev;
        });
      }
    }, 3000);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event);

      if (event === 'SIGNED_OUT' || !session) {
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
        setState(prev => ({
          ...prev,
          user: session.user,
          isLoading: false,
        }));

        // Fetch profile
        const profile = await fetchProfile(session.user.id);
        if (mounted) {
          setState(prev => ({
            ...prev,
            profile: profile || null,
            profileChecked: true,
            isAdmin: profile?.role === "admin",
          }));
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

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
  }, [supabase]);

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
