import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface AuthScreensProps {
  mode: 'login' | 'signup';
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onSuccessAuth: () => void;
  onBack: () => void;
  // Injected from App.tsx – real Supabase auth actions
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string, name: string) => Promise<boolean>;
  onGoogleAuth: () => Promise<boolean>;
  authError: string | null;
  authLoading: boolean;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({
  mode,
  onSwitchMode,
  onSuccessAuth,
  onBack,
  onLogin,
  onRegister,
  onGoogleAuth,
  authError,
  authLoading,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = authError ?? localError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) { setLocalError('Email is required'); return; }
    if (!password) { setLocalError('Password is required'); return; }
    if (mode === 'signup' && !username.trim()) { setLocalError('Name is required'); return; }
    if (mode === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    let success = false;
    if (mode === 'login') {
      success = await onLogin(email, password);
    } else {
      success = await onRegister(email, password, username);
    }

    if (success) {
      setShowSuccessModal(true);
    }
  };

  const handleGoogleAuth = async () => {
    setLocalError(null);
    await onGoogleAuth();
    // Google redirects the page — success modal not needed here
  };

  return (
    <div className="min-h-screen bg-[#f8faf7] text-[#191c1b] flex flex-col md:flex-row relative">
      {/* Decorative Image Side (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 relative bg-[#f2f4f1] overflow-hidden min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBXkx8xBLrKKV3xBpWOl5syIT0oXFt5440OevuxvJz44Ou9js_ywNJMWNn8711j9gzwDDhZnuyYBYjiOmt7ft0XwH8nZ1Mz7PD_tdW-lmC2IZtwDoPQqBYeIrtmS_o15-HDlzAKE2rfz9eOdaz5hb-yhqSJATgG2ApAufUVfWpXYsU8Z9W0NdZi7b4XeT_kpVNPFqwVoTmcl0Y4oGZVt_7FKC2nKIfHdqcaWVsaUDu8JYHQJQZzJcF1')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#4c6635]/80 via-[#4c6635]/30 to-transparent" />
        <div className="absolute bottom-12 left-10 right-10 text-white z-10 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white text-[#4c6635] flex items-center justify-center font-bold">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.5 9.5 0 0 0 17 8M3.27 3L2 4.27l4.08 4.08C4.5 10.9 3.5 13.8 3.5 17c0 1.25.21 2.45.58 3.57L6 20.35A9.45 9.45 0 0 1 5.5 17c0-2.6 1-5 2.72-6.72L12 14v1.5a5.5 5.5 0 0 0 5.5 5.5h1.5v-1.5a5.5 5.5 0 0 0-5.5-5.5H12V12l3.28-3.28C14.1 8.28 13.07 8 12 8c-.68 0-1.34.12-1.95.34L3.27 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">FloraVeda</h2>
          </div>
          <p className="text-lg opacity-90 font-medium">
            Cultivate your urban garden with precision and care.
          </p>
        </div>
      </div>

      {/* Form Container Side */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-10 min-h-screen relative z-10">
        {/* Mobile Header with Back */}
        <div className="md:hidden flex justify-between items-center h-14 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#44483e] hover:bg-[#e7e9e6] active:scale-95 transition-transform"
          >
            <ArrowRight className="w-5 h-5 transform rotate-180" />
          </button>
          <span className="font-bold text-xl text-[#4c6635]">FloraVeda</span>
          <div className="w-10" />
        </div>

        <div className="max-w-md mx-auto w-full">
          <div className="bg-white md:bg-transparent rounded-3xl p-6 md:p-0 shadow-sm md:shadow-none border border-[#e1e3e0]/60 md:border-none">
            {/* Header */}
            <div className="text-center md:text-left mb-8">
              <div className="md:hidden flex justify-center mb-3 text-[#4c6635]">
                <div className="w-12 h-12 rounded-2xl bg-[#cdecae]/50 flex items-center justify-center">
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.5 9.5 0 0 0 17 8M3.27 3L2 4.27l4.08 4.08C4.5 10.9 3.5 13.8 3.5 17c0 1.25.21 2.45.58 3.57L6 20.35A9.45 9.45 0 0 1 5.5 17c0-2.6 1-5 2.72-6.72L12 14v1.5a5.5 5.5 0 0 0 5.5 5.5h1.5v-1.5a5.5 5.5 0 0 0-5.5-5.5H12V12l3.28-3.28C14.1 8.28 13.07 8 12 8c-.68 0-1.34.12-1.95.34L3.27 3z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-[#191c1b] tracking-tight">
                {mode === 'login' ? 'Welcome back' : 'Sign up'}
              </h1>
              <p className="text-sm md:text-base text-[#44483e] mt-1.5">
                {mode === 'login'
                  ? 'Welcome back. Nurture your green space.'
                  : 'Create your account to start your botanical journey.'}
              </p>
            </div>

            {/* Error Banner */}
            {displayError && (
              <div className="mb-4 flex items-start gap-2.5 bg-[#ffdad6] text-[#93000a] rounded-xl px-4 py-3 text-sm font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{displayError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#191c1b] ml-1">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#74796d]" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#c4c8ba] bg-[#f8faf7] focus:bg-white focus:border-[#4c6635] focus:ring-1 focus:ring-[#4c6635] outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#191c1b] ml-1">Email address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#74796d]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#c4c8ba] bg-[#f8faf7] focus:bg-white focus:border-[#4c6635] focus:ring-1 focus:ring-[#4c6635] outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#191c1b] ml-1">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#74796d]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-[#c4c8ba] bg-[#f8faf7] focus:bg-white focus:border-[#4c6635] focus:ring-1 focus:ring-[#4c6635] outline-none transition-all text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#74796d] hover:text-[#191c1b] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[#44483e]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#4c6635] rounded border-[#c4c8ba] focus:ring-[#4c6635]"
                    />
                    <span>Remember Me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to your registered email.')}
                    className="text-xs font-semibold text-[#4c6635] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#4c6635] hover:bg-[#354e1f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base py-4 rounded-xl shadow-md active:scale-98 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? 'Login' : 'Sign up'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#c4c8ba]/50" />
              </div>
              <span className="relative bg-white md:bg-[#f8faf7] px-3 text-xs font-semibold text-[#74796d] uppercase tracking-wider">
                OR
              </span>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#c4c8ba] text-[#191c1b] font-semibold text-sm py-3.5 rounded-xl hover:bg-[#f2f4f1] transition-colors active:scale-98 shadow-sm cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>{mode === 'login' ? 'Login with Google' : 'Continue with Google'}</span>
            </button>

            {/* Switch Mode Link */}
            <p className="text-center mt-6 text-sm text-[#44483e]">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[#4c6635] font-bold hover:underline underline-offset-4 cursor-pointer ml-1"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[28px] shadow-[0_20px_50px_rgba(76,102,53,0.25)] p-8 flex flex-col items-center text-center relative overflow-hidden border border-[#cdecae]/40">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#cdecae] opacity-40 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#d2e9ce] opacity-40 rounded-full blur-xl pointer-events-none" />
            <div className="w-20 h-20 bg-[#8ba870] text-[#0d2000] rounded-full flex items-center justify-center mb-6 shadow-inner relative z-10 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-[#191c1b] mb-2 tracking-tight">
              {mode === 'login' ? 'Yeay! Welcome Back' : 'Account Created!'}
            </h3>
            <p className="text-sm text-[#44483e] leading-relaxed mb-8 max-w-[260px]">
              {mode === 'login'
                ? 'Your plants have missed you. Let\'s check on your garden health.'
                : 'Welcome to FloraVeda! Your botanical journey begins now.'}
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                onSuccessAuth();
              }}
              className="w-full bg-[#4c6635] hover:bg-[#354e1f] text-white font-semibold text-base py-4 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Go To Home</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
