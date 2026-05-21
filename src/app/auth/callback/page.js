"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    const handleCallback = async () => {
      // Try 1: listen for auth state change (Supabase handles PKCE automatically)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          router.push("/");
        }
      });

      // Try 2: manually exchange the code using the full URL
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        console.error("Auth callback error:", error.message);
        // Try 3: check if already have a session (implicit flow)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/");
        } else {
          setStatus("Sign-in failed — " + error.message);
          setTimeout(() => router.push("/login"), 3000);
        }
      } else {
        router.push("/");
      }
    };
    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-spin">🧪</div>
        <p className="text-slate-500 font-medium">{status}</p>
      </div>
    </div>
  );
}
