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

// Fetch profile using direct fetch (bypass Supabase client issues)
async function fetchProfileDirect(userId: string, accessToken: string): Promise<Profile | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('[AUTH] Fetching profile for:', userId);
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.log('[AUTH] Profile fetch failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('[AUTH] Profile data:', data?.[0]?.role || 'no role');
    return data?.[0] || null;
  } catch (e) {
    console.log('[AUTH] Profile fetch error:', e);
    return null;
  }
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
      // Keep isLoading true until profile is fetched
      setState({ user: session.user });
      
      // Fetch profile using direct fetch
      const profile = await fetchProfileDirect(session.user.id, session.access_token);
      if (profile) {
        console.log('[AUTH] Profile loaded, admin:', profile.role === 'admin');
        setState({ profile, isAdmin: profile.role === "admin", isLoading: false });
      } else {
        // Profile fetch failed, but we have a user
        setState({ isLoading: false });
      }
    }
  });
  
  // Also check current session
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    console.log('[AUTH] Initial session:', session?.user?.email || 'none');
    
    if (session?.user) {
      // Keep isLoading true until profile is fetched
      setState({ user: session.user });
      
      // Fetch profile using direct fetch
      const profile = await fetchProfileDirect(session.user.id, session.access_token);
      if (profile) {
        console.log('[AUTH] Profile loaded, admin:', profile.role === 'admin');
        setState({ profile, isAdmin: profile.role === "admin", isLoading: false });
      } else {
        // Profile fetch failed, but we have a user
        setState({ isLoading: false });
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
