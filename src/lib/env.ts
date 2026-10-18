// Public configuration. NEXT_PUBLIC_* values are inlined at build time and are
// safe to ship to the browser (Row Level Security protects the data).

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// New Supabase projects expose a "publishable" key; older ones an "anon" key.
// Both are public and work the same way with @supabase/ssr.
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return supabaseUrl.length > 0 && supabasePublishableKey.length > 0;
}

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
    );
    this.name = "SupabaseNotConfiguredError";
  }
}
