import { createBrowserClient } from "@supabase/ssr";
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Deji NEXT_PUBLIC_SUPABASE_URL iyo NEXT_PUBLIC_SUPABASE_ANON_KEY gudaha .env.local");
  return createBrowserClient(url, key);
}