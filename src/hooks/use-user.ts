"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/types/supabase";

type Profile = Tables<"users">;

// ============================================
// GLOBAL AUTH STORE
// ============================================
interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

let state: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
};

let listeners: Set<() => void> = new Set();
let initialized = false;

function getState() {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(newState: Partial<AuthState>) {
  state = { ...state, ...newState };
  listeners.forEach(l => l());
}

// Initialize auth once
function initAuth() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  
  console.log('[AUTH] Initializing...');
  const supabase = createClient();
  
  // Set up auth listener FIRST
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[AUTH] Event:', event, session?.user?.email || 'no user');
    
    if (event === 'SIGNED_OUT') {
      setState({ user: null, profile: null, isAdmin: false, isLoading: false });
      return;
    }
    
    if (session?.user) {
      setState({ user: session.user, isLoading: false });
      
      // Fetch profile
      try {
        const { data: profile } = await (supabase.from("users") as any)
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          setState({ profile, isAdmin: profile.role === "admin" });
        }
      } catch (e) {
        console.log('[AUTH] Profile fetch error:', e);
      }
    }
  });
  
  // Also check current session
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    console.log('[AUTH] Initial session:', session?.user?.email || 'none');
    
    if (session?.user) {
      setState({ user: session.user, isLoading: false });
      
      try {
        const { data: profile } = await (supabase.from("users") as any)
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          setState({ profile, isAdmin: profile.role === "admin" });
        }
      } catch (e) {
        console.log('[AUTH] Profile fetch error:', e);
      }
    } else {
      setState({ isLoading: false });
    }
  }).catch(e => {
    console.log('[AUTH] getSession error:', e);
    setState({ isLoading: false });
  });
  
  // Fallback timeout - if still loading after 5s, assume no session
  setTimeout(() => {
    if (state.isLoading) {
      console.log('[AUTH] Timeout - assuming no session');
      setState({ isLoading: false });
    }
  }, 5000);
}

// ============================================
// HOOK
// ============================================
export function useUser() {
  // Initialize on first use
  useEffect(() => {
    initAuth();
  }, []);
  
  // Subscribe to state changes using useSyncExternalStore for proper React 18 support
  const currentState = useSyncExternalStore(subscribe, getState, getState);
  
  const signOut = useCallback(async () => {
    console.log('[AUTH] Signing out...');
    const supabase = createClient();
    await supabase.auth.signOut();
    setState({ user: null, profile: null, isAdmin: false });
  }, []);
  
  return {
    user: currentState.user,
    profile: currentState.profile,
    isLoading: currentState.isLoading,
    isAdmin: currentState.isAdmin,
    signOut,
  };
}

// ============================================
// HELPERS
// ============================================
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
