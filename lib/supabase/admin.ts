import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Server-only — never import this from a
// Client Component. All ownership/token checks must happen in the calling code.
//
// `cache: "no-store"` is required here: Next.js patches the global `fetch` and
// otherwise applies its Data Cache to supabase-js's internal HTTP calls, which
// silently serves stale rows (e.g. a candidate's session still reading as
// "in_progress" right after it was marked completed) regardless of the route's
// own `dynamic` segment config.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}
