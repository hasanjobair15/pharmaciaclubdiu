import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Support both the newer Supabase publishable key
  // and the older anon key name.
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to your environment variables."
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing Supabase browser key. Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
}
