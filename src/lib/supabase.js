import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        flowType: "implicit",      // simpler — no code exchange needed
        detectSessionInUrl: true,  // auto-picks session from URL hash
        persistSession: true,
      },
    })
  : null;
