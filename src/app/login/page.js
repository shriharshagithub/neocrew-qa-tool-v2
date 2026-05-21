"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-qa-bg dot-grid flex items-center justify-center p-6 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm slide-in">

        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-qa-card border border-qa-border flex items-center justify-center text-3xl amber-glow">
            🧪
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-qa-text tracking-tight mb-2">
            NeoCrew QA
          </h1>
          <p className="text-qa-muted text-sm">
            Capture bugs. Ship with confidence.
          </p>
        </div>

        {/* Card */}
        <div className="qa-card p-8 amber-glow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-qa-faint mb-5 text-center">
            Sign in to continue
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl
              font-semibold text-sm transition-all duration-200 cursor-pointer border
              ${loading
                ? "bg-qa-card border-qa-border text-qa-faint cursor-not-allowed"
                : "bg-qa-surface border-qa-bright text-qa-text hover:border-amber-500/40 hover:bg-qa-card"
              }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-qa-faint border-t-amber-500 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          {error && (
            <p className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
              {error}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-qa-faint mt-6">
          NeoCrew internal tool · team only
        </p>
      </div>
    </div>
  );
}
