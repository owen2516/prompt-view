import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side client that reads/writes the admin's auth session via cookies.
// Used in Server Components, Route Handlers and middleware to identify "who is logged in".
// It still respects RLS (anon-key based), so it must never be used to read/write the
// candidate-facing tables (interview_sessions / ai_messages / recordings) directly.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render; middleware refreshes the session instead.
          }
        },
      },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}
