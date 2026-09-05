import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/env";

let client: SupabaseClient | null | undefined;

/**
 * Browser Supabase client for prototype commenting. Returns `null` when the
 * env vars are missing — callers hide the comment UI and the app behaves as if
 * the feature does not exist.
 */
export function getSupabase(): SupabaseClient | null {
  if (client === undefined) {
    const key =
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    client =
      env.NEXT_PUBLIC_SUPABASE_URL && key
        ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
            auth: { persistSession: false },
          })
        : null;
  }
  return client;
}
