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
  isAdmin: boolean;
}

// Global state to share across all hook instances
let globalUser: User | null = null;
let globalProfile: Profile | null = null;
let globalIsAdmin = false;
let globalInitialized = false;
let globalLoading = true;

// Subscribers to notify when state changes
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach(fn => fn());
}

/**
 * Auth hook - uses global singleton state
 */
export function useUser() {
  const [, forceUpdate] = useState(0);
  
  // Subscribe to global state changes
  useEffect(() => {
    const update = () => forceUpdate(n => n + 1);
    subscribers.add(update);
    return () => { subscribers.delete(update); };
  }, []);

  // Initialize auth only once globally
  useEffect(() => {
    if (globalInitialized) {
      console.log('[USE-USER] Already initialized, user:', globalUser?.email || 'none');
      return;
    }
    globalInitialized = true;
    
    console.log('[USE-USER] ====== GLOBAL INIT ======');
    
    const supabase = createClient();
    
    // Listen for auth changes FIRST - this is the source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[USE-USER] Auth event:', event, session?.user?.email || 'no user');
        
        if (event === 'SIGNED_OUT') {
          globalUser = null;
          globalProfile = null;
          globalIsAdmin = false;
          globalLoading = false;
          notifySubscribers();
          return;
        }
        
        if (session?.user) {
          console.log('[USE-USER] Setting user from auth event:', session.user.email);
          globalUser = session.user;
          globalLoading = false;
          notifySubscribers();
          
          // Fetch profile in background
          const { data: profile } = await (supabase.from("users") as any)
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          if (profile) {
            globalProfile = profile;
            globalIsAdmin = profile.role === "admin";
            notifySubscribers();
          }
        }
      }
    );
    
    // Also try getSession as backup, but DON'T overwrite if auth event already fired
    const initAuth = async () => {
      console.log('[USE-USER] Checking session...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // ONLY set user if we don't already have one from auth event
        if (session?.user && !globalUser) {
          console.log('[USE-USER] Session found (backup):', session.user.email);
          globalUser = session.user;
          globalLoading = false;
          notifySubscribers();
          
          const { data: profile } = await (supabase.from("users") as any)
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          if (profile) {
            globalProfile = profile;
            globalIsAdmin = profile.role === "admin";
            notifySubscribers();
          }
        } else if (!session && !globalUser) {
          // No session AND no user from auth event = truly not logged in
          console.log('[USE-USER] No session, no auth event user');
          globalLoading = false;
          notifySubscribers();
        } else {
          console.log('[USE-USER] Session check complete, user already set from auth event');
          globalLoading = false;
          notifySubscribers();
        }
      } catch (err) {
        console.log('[USE-USER] getSession error:', err);
        // Don't clear user on error - might already be set from auth event
        if (!globalUser) {
          globalLoading = false;
          notifySubscribers();
        }
      }
    };
    
    // Small delay to let auth event fire first
    setTimeout(initAuth, 100);
    
    return () => {
      // Don't cleanup - keep global state
    };
  }, []);

  const signOut = useCallback(async () => {
    console.log('[USE-USER] Sign out');
    const supabase = createClient();
    await supabase.auth.signOut();
    globalUser = null;
    globalProfile = null;
    globalIsAdmin = false;
    notifySubscribers();
  }, []);

  return {
    user: globalUser,
    profile: globalProfile,
    isLoading: globalLoading,
    isAdmin: globalIsAdmin,
    signOut,
  };
}

export function getDisplayName(user: User | null, profile: Profile | null): string {
  if (profile?.display_name) return profile.display_name;
  if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
  if (user?.user_metadata?.name) return user.user_metadata.name;
  if (user?.email) return user.email.split("@")[0];
  return "User";
}

export function getAvatarUrl(user: User | null, profile: Profile | null): string | null {
  if (profile?.avatar_url) return profile.avatar_url;
  if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
  if (user?.user_metadata?.picture) return user.user_metadata.picture;
  return null;
}
