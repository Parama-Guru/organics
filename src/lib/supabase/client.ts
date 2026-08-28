import { createBrowserClient } from "@supabase/ssr";

// Reads the values next.config.ts inlines; conf/config.yaml is unreadable here.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  );
}
