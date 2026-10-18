import { Logo } from "@/components/layout/logo";

/** Shown instead of the regular header when Supabase env vars are missing. */
export function SetupNotice() {
  return (
    <header className="border-b border-border bg-warning-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 sm:px-6 md:flex-row md:items-center md:gap-6">
        <Logo />
        <p className="text-sm text-warning" role="status">
          <strong>Setup required:</strong> set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code> (see <code>.env.example</code> and the
          README), then restart the server. Sign-in and all data features are disabled until then.
        </p>
      </div>
    </header>
  );
}
