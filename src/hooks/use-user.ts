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
      console.log('[USE-USER] Already initialized globally');
      return;
    }
    globalInitialized = true;
    
    console.log('[USE-USER] ====== GLOBAL INIT ======');
    
    const supabase = createClient();
    
    // Get initial session with timeout
    const initAuth = async () => {
      console.log('[USE-USER] Getting session...');
      
      // Timeout after 3 seconds
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.log('[USE-USER] getSession timeout!');
          resolve(null);
        }, 3000);
      });
      
      const sessionPromise = supabase.auth.getSession().then(({ data }) => data.session);
      
      const session = await Promise.race([sessionPromise, timeoutPromise]);
      
      if (session?.user) {
        console.log('[USE-USER] Session found:', session.user.email);
        globalUser = session.user;
        globalLoading = false;
        notifySubscribers();
        
        // Fetch profile
        const { data: profile } = await (supabase.from("users") as any)
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          console.log('[USE-USER] Profile loaded, admin:', profile.role === "admin");
          globalProfile = profile;
          globalIsAdmin = profile.role === "admin";
          notifySubscribers();
        }
      } else {
        console.log('[USE-USER] No session');
        globalUser = null;
        globalProfile = null;
        globalIsAdmin = false;
        globalLoading = false;
        notifySubscribers();
      }
    };
    
    initAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[USE-USER] Auth event:', event);
        
        if (event === 'SIGNED_OUT') {
          globalUser = null;
          globalProfile = null;
          globalIsAdmin = false;
          globalLoading = false;
          notifySubscribers();
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[USE-USER] Signed in:', session.user.email);
          globalUser = session.user;
          globalLoading = false;
          notifySubscribers();
          
          // Fetch profile
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
    
    // Don't cleanup on unmount - keep subscription alive
    return () => {
      // Only cleanup if page is actually unloading
      if (typeof window !== 'undefined' && window.performance?.navigation?.type === 2) {
        subscription.unsubscribe();
        globalInitialized = false;
      }
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
