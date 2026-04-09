import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("[Supabase] URL:", url ? url : "MISSING");
console.log("[Supabase] Key:", key ? key.substring(0, 20) + "..." : "MISSING");

export const supabase = url && key ? createClient(url, key) : null;

console.log("[Supabase] Client initialized:", supabase !== null);
