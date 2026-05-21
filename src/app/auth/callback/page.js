"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    // With implicit flow, Supabase detects the session from the URL hash automatically.
    // We just wait for the SIGNED_IN event and redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        router.push("/");
      }
    });

    // Also check if session already exists (in case event fired before listener)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/");
    });

    // Timeout fallback
    const timeout = setTimeout(() => {
      setStatus("Taking too long — redirecting to login…");
      setTimeout(() => router.push("/login"), 2000);
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
