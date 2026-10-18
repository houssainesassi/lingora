import { createBrowserClient } from "@supabase/ssr";

import { SupabaseNotConfiguredError, isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Browser Supabase client (singleton). Used for realtime and uploads. */
export function createClient() {
  if (!isSupabaseConfigured()) throw new SupabaseNotConfiguredError();
  browserClient ??= createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
  return browserClient;
}
