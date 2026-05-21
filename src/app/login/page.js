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

      {/* Centered content */}
      <div className="w-full max-w-[340px]">

        {/* Logo + name */}
        <div className="flex flex-col items-center mb-10">
          <img src="/neocrew-logo.png" alt="NeoCrew QA" className="h-9 w-auto mb-2" />
          <p className="text-ink-tertiary text-sm text-center">
            Capture bugs and ship with confidence
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-px" style={{ background: "linear-gradient(135deg, rgba(94,106,210,0.3) 0%, rgba(255,255,255,0.06) 50%, transparent 100%)" }}>
          <div className="rounded-2xl bg-s1 p-6">

            <button
              onClick={login}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-s2 hover:bg-s3
                         border border-hairline-strong
                         text-ink text-sm font-medium px-4 py-2.5 rounded-xl
                         transition-all duration-150 cursor-pointer disabled:opacity-50
                         disabled:cursor-not-allowed active:scale-[0.98]"
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
        </div>

        <p className="text-center text-xs text-ink-tertiary mt-5">
          Access restricted to NeoCrew team members
        </p>
      </div>
    </div>
  );
}
