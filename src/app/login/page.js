"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const login = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-[360px]">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="#5e6ad2"/>
              <rect x="13" y="2" width="9" height="9" rx="2" fill="#5e6ad2" opacity="0.6"/>
              <rect x="2" y="13" width="9" height="9" rx="2" fill="#5e6ad2" opacity="0.6"/>
              <rect x="13" y="13" width="9" height="9" rx="2" fill="#5e6ad2" opacity="0.3"/>
            </svg>
            <span className="text-ink font-semibold text-base tracking-tight">NeoCrew QA</span>
          </div>
          <h1 className="text-ink text-2xl font-semibold tracking-tight mb-2">
            Sign in to continue
          </h1>
          <p className="text-ink-subtle text-sm">
            Internal QA tool for the NeoCrew team
          </p>
        </div>

        {/* Form card */}
        <div className="l-card p-6">
          <button
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-s2 hover:bg-s3
                       border border-hairline hover:border-hairline-strong
                       text-ink text-sm font-medium px-4 py-2.5 rounded-lg
                       transition-colors duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-hairline-strong border-t-lavender rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            <span>{loading ? "Redirecting…" : "Continue with Google"}</span>
          </button>

          {error && (
            <p className="mt-4 text-xs text-tag-red bg-tag-red/10 border border-tag-red/20 rounded-lg px-3 py-2 text-center">
              {error}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-ink-tertiary mt-5">
          Access restricted to NeoCrew team members
        </p>
      </div>
    </div>
  );
}
