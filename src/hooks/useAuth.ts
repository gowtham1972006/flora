import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signIn, signUp, signInWithGoogle, signOut } from '../lib/auth';
import { fetchProfile } from '../lib/profile';
import { seedDefaultCareTasks } from '../lib/careTasks';
import { seedDefaultNotifications } from '../lib/notifications';
import type { UserProfile } from '../types';

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Guard so the onAuthStateChange SIGNED_OUT event doesn't fight with
  // the explicit logout navigation in App.tsx
  const isLoggingOutRef = useRef(false);
  const profileLoadedForRef = useRef<string | null>(null); // dedupe rapid calls

  // Load profile after session is available — never throws
  const loadProfile = useCallback(async (userId: string) => {
    // Don't re-fetch if we already loaded for this user in this session
    if (profileLoadedForRef.current === userId) return;
    profileLoadedForRef.current = userId;
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
    } catch (err) {
      console.warn('[FloraVeda] loadProfile failed silently:', err);
      setProfile({
        name: 'Plant Lover',
        role: 'Plant Enthusiast',
        avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}`,
        plantsCount: 0,
        favoritesCount: 0,
      });
    }
  }, []);

  // Seed initial data for new users
  const seedNewUserData = useCallback(async (userId: string) => {
    await Promise.all([
      seedDefaultCareTasks(userId),
      seedDefaultNotifications(userId),
    ]);
  }, []);

  // Bootstrap: get initial session and listen for auth changes
  useEffect(() => {
    let mounted = true;

    // Safety timeout — if getSession hangs for any reason, stop loading after 5s
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          void loadProfile(s.user.id);
        }
      })
      .catch((err) => {
        console.error('getSession failed:', err);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (mounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!mounted) return;
        // If we initiated logout ourselves, ignore this event —
        // App.tsx handles the navigation directly
        if (isLoggingOutRef.current && s === null) return;

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await loadProfile(s.user.id);
          void seedNewUserData(s.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadProfile, seedNewUserData]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error?.message ?? 'Login failed');
      return false;
    }
    return true;
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string): Promise<boolean> => {
      setError(null);
      setLoading(true);
      const result = await signUp(email, password, name);
      setLoading(false);
      if (!result.success) {
        setError(result.error?.message ?? 'Sign up failed');
        return false;
      }
      return true;
    },
    []
  );

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setError(null);
    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error?.message ?? 'Google sign-in failed');
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    isLoggingOutRef.current = true;
    profileLoadedForRef.current = null; // allow profile reload on next login
    await signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
    setTimeout(() => { isLoggingOutRef.current = false; }, 500);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      profileLoadedForRef.current = null; // force re-fetch
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  return {
    session,
    user,
    profile,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    clearError,
    refreshProfile,
  };
}
