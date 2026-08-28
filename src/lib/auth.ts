import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthError {
  message: string;
}

export interface AuthResult {
  success: boolean;
  error?: AuthError;
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: name.trim() },
    },
  });

  if (error) return { success: false, error: { message: error.message } };
  return { success: true };
}

// ─── Sign In (email + password) ───────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) return { success: false, error: { message: error.message } };
  return { success: true };
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────
// Supabase handles the full OAuth redirect flow.
// After redirect the client detects the session from the URL automatically.
export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectTo =
    (import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${redirectTo}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) return { success: false, error: { message: error.message } };
  // Redirect happens automatically — no success value is meaningfully returned
  return { success: true };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: { message: error.message } };
  return { success: true };
}

// ─── Get current session user ID ─────────────────────────────────────────────
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

// ─── Password reset email ─────────────────────────────────────────────────────
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const redirectTo =
    (import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin;

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${redirectTo}/auth/reset-password` }
  );

  if (error) return { success: false, error: { message: error.message } };
  return { success: true };
}
