import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthError {
  message: string;
}

export interface AuthResult {
  success: boolean;
  error?: AuthError;
  /** True when signup succeeded but email confirmation is still required.
   *  In this case data.session is null — the user is NOT yet authenticated. */
  needsEmailConfirmation?: boolean;
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: name.trim() },
    },
  });

  if (error) return { success: false, error: { message: error.message } };

  // data.session is null when Supabase requires email confirmation before
  // granting a session. data.user will exist but is not yet authenticated.
  const needsEmailConfirmation = !data.session;
  return { success: true, needsEmailConfirmation };
}

// ─── Sign In (email + password) ───────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    // Surface the full error in dev so we can diagnose the real cause
    console.error('[Flora] signInWithPassword failed:', {
      message: error.message,
      status: error.status,
      code: (error as { code?: string }).code,
    });
    return { success: false, error: { message: error.message } };
  }

  console.info('[Flora] signInWithPassword succeeded. User:', data.user?.id);
  return { success: true };
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────
// Supabase handles the full OAuth redirect flow.
// After redirect the client detects the session from the URL automatically.
// redirectTo uses window.location.origin (runtime) so that localhost, Vercel,
// and any future domain all self-configure without any env-var dependency.
export async function signInWithGoogle(): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
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
// redirectTo uses window.location.origin so the reset link always points back
// to whatever domain the user is on (localhost, Vercel, custom domain, etc.).
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${window.location.origin}/auth/reset-password` }
  );

  if (error) return { success: false, error: { message: error.message } };
  return { success: true };
}
