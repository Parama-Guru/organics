import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { loadConfig } from "@conf/config";

// Uses the publishable key, so Row Level Security still applies to every query.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabase } = loadConfig();

  return createServerClient(supabase.url, supabase.publishable_key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Harmless when middleware
          // refreshes the session; without middleware the token just isn't rotated here.
        }
      },
    },
  });
}
