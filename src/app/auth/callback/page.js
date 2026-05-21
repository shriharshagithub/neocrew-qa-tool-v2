"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase v2 with PKCE — exchange the code in the URL
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.search
      );
      if (error) {
        setStatus("Sign-in failed. Redirecting…");
        setTimeout(() => router.push("/login"), 2000);
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
