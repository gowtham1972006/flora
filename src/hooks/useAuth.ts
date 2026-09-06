import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signIn, signUp, signInWithGoogle, signOut } from '../lib/auth';
import { fetchProfile } from '../lib/profile';
import { seedDefaultCareTasks } from '../lib/careTasks';
import { seedDefaultNotifications } from '../lib/notifications';
import type { UserProfile } from '../types';

// ── 5-minute refresh-logout rule ────────────────────────────────────────────
// Only evaluated during page initialisation (getSession). Never runs as a
// background timer — continuous use is never interrupted.
const FLORA_AUTH_LAST_SEEN_KEY = 'flora_auth_last_seen';
const REFRESH_LOGOUT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// ── Extract display name from Supabase auth user metadata ──────────────────
// Google OAuth sets user_metadata.name (and sometimes full_name).
// Email signup sets user_metadata.full_name.
function extractMetaName(u: User): string | undefined {
  return (
    (u.user_metadata?.full_name as string | undefined) ||
    (u.user_metadata?.name as string | undefined) ||
    undefined
  );
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  /** True after signup when the Supabase project requires email confirmation.
   *  The user is NOT yet authenticated in this state. */
  needsEmailConfirmation: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearNeedsEmailConfirmation: () => void;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  // Guard so the onAuthStateChange SIGNED_OUT event doesn't fight with
  // the explicit logout navigation in App.tsx
  const isLoggingOutRef = useRef(false);
  const profileLoadedForRef = useRef<string | null>(null); // dedupe rapid calls

  // Load profile after session is available — never throws
  // fallbackName: the full_name from Supabase auth user metadata
  const loadProfile = useCallback(async (userId: string, fallbackName?: string) => {
    // Don't re-fetch if we already loaded for this user in this session
    if (profileLoadedForRef.current === userId) return;
    profileLoadedForRef.current = userId;
    try {
      const p = await fetchProfile(userId, fallbackName);
      setProfile(p);
    } catch (err) {
      console.warn('[Flora] loadProfile failed silently:', err);
      setProfile({
        name: fallbackName || 'Plant Lover',
        role: 'Plant Enthusiast',
        avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}`,
        plantsCount: 0,
        favoritesCount: 0,
      });
    }
  }, []);

  // Seed initial data for new users — errors are silently ignored so they
  // can never propagate to the onAuthStateChange handler and skip setLoading.
  const seedNewUserData = useCallback(async (userId: string) => {
    try {
      await Promise.all([
        seedDefaultCareTasks(userId),
        seedDefaultNotifications(userId),
      ]);
    } catch (err) {
      console.warn('[Flora] seedNewUserData failed silently:', err instanceof Error ? err.message : err);
    }
  }, []);

  // Bootstrap: get initial session and listen for auth changes
  useEffect(() => {
    let mounted = true;
    // Track whether onAuthStateChange has fired its first event.
    // getSession() can return null for Google OAuth while the token is still
    // being hydrated — onAuthStateChange is the authoritative source of truth.
    let authListenerFired = false;

    // Safety timeout — last-resort fallback if BOTH getSession and
    // onAuthStateChange fail to resolve (e.g. network down).
    const timeout = setTimeout(() => {
      console.warn('[AUTH] safety timeout fired — forcing loading=false');
      if (mounted) setLoading(false);
    }, 10000);

    // ── Register the auth listener FIRST (before getSession) ─────────────────
    // This ensures we never miss an event that fires before getSession resolves.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!mounted) return;
        if (isLoggingOutRef.current && s === null) return;

        console.log('[AUTH INIT] event:', _event, '| session:', !!s, '| user:', !!s?.user);

        // ── 5-minute refresh rule — evaluated once on INITIAL_SESSION ─────────
        // INITIAL_SESSION is the authoritative first event on every page load.
        // It correctly reflects the real persisted session (unlike getSession()
        // which can return null during Google OAuth token hydration).
        if (_event === 'INITIAL_SESSION') {
          authListenerFired = true;
          if (s?.user) {
            const rawTs = localStorage.getItem(FLORA_AUTH_LAST_SEEN_KEY);
            const lastSeen = rawTs ? parseInt(rawTs, 10) : null;
            const elapsed = lastSeen !== null ? Date.now() - lastSeen : null;
            console.log('[AUTH LAST SEEN] elapsed ms:', elapsed, '| threshold:', REFRESH_LOGOUT_THRESHOLD_MS);

            if (elapsed !== null && elapsed >= REFRESH_LOGOUT_THRESHOLD_MS) {
              // Refresh happened after 5 minutes — sign out.
              console.log('[AUTH] 5-min refresh rule triggered — signing out.');
              try { localStorage.removeItem(FLORA_AUTH_LAST_SEEN_KEY); } catch { /* ignore */ }
              await supabase.auth.signOut();
              // signOut triggers another SIGNED_OUT event which will
              // setUser(null) and setLoading(false) via the handler below.
              return;
            }

            // Session is valid — refresh the timestamp.
            try { localStorage.setItem(FLORA_AUTH_LAST_SEEN_KEY, Date.now().toString()); } catch { /* ignore */ }
          }
          // Fall through to normal state update below.
        }

        setSession(s);
        setUser(s?.user ?? null);

        try {
          if (s?.user) {
            // SIGNED_IN = fresh login / OAuth callback → force profile re-fetch.
            // INITIAL_SESSION = page reload → allow dedup ref to prevent double-fetch.
            if (_event === 'SIGNED_IN') {
              profileLoadedForRef.current = null;
              try { localStorage.setItem(FLORA_AUTH_LAST_SEEN_KEY, Date.now().toString()); } catch { /* ignore */ }
            }
            const metaName = extractMetaName(s.user);
            await loadProfile(s.user.id, metaName);
            void seedNewUserData(s.user.id);
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.warn('[AUTH] unexpected error in auth handler:', err instanceof Error ? err.message : err);
        } finally {
          clearTimeout(timeout);
          if (mounted) setLoading(false);
        }
      }
    );

    // ── getSession() — used only to prime state if listener fires late ────────
    // For Google OAuth, this may return null even when a valid session exists
    // because the token is still being hydrated from storage. In that case we
    // rely on onAuthStateChange(INITIAL_SESSION) which fires shortly after.
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        if (!mounted) return;
        console.log('[AUTH SESSION] getSession resolved | session:', !!s, '| listenerFired:', authListenerFired);
        // If the auth listener already fired with the definitive state,
        // don't overwrite it with a potentially stale getSession() result.
        if (authListenerFired) return;
        // Listener hasn't fired yet — prime the user state so the UI isn't
        // blank while we wait. The listener will correct it if needed.
        if (s?.user) {
          setSession(s);
          setUser(s.user);
          void loadProfile(s.user.id, extractMetaName(s.user));
        }
      })
      .catch((err) => {
        console.error('[AUTH] getSession failed:', err instanceof Error ? err.message : err);
      });

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
      // Propagate the email-confirmation-pending flag so AuthScreens can
      // display the correct message instead of a misleading "logged in" state.
      setNeedsEmailConfirmation(result.needsEmailConfirmation ?? false);
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
    setNeedsEmailConfirmation(false);
    const result = await signOut();
    if (!result.success) {
      console.error('[AUTH] signOut failed:', result.error?.message);
      // Do not pretend logout succeeded — surface the error and bail.
      isLoggingOutRef.current = false;
      setError(result.error?.message ?? 'Logout failed');
      return;
    }
    // Remove the refresh-rule timestamp so a post-logout refresh never
    // re-authenticates the cleared session.
    try { localStorage.removeItem(FLORA_AUTH_LAST_SEEN_KEY); } catch { /* ignore */ }
    setProfile(null);
    setSession(null);
    setUser(null);
    setLoading(false); // ensure loading never stays true after logout
    setTimeout(() => { isLoggingOutRef.current = false; }, 500);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const clearNeedsEmailConfirmation = useCallback(
    () => setNeedsEmailConfirmation(false),
    []
  );

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      profileLoadedForRef.current = null; // force re-fetch
      await loadProfile(user.id, extractMetaName(user));
    }
  }, [user, loadProfile]);

  return {
    session,
    user,
    profile,
    loading,
    error,
    needsEmailConfirmation,
    login,
    register,
    loginWithGoogle,
    logout,
    clearError,
    clearNeedsEmailConfirmation,
    refreshProfile,
  };
}
