import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { ButtonLink } from "@/components/ui/button";
import { dashboardPath, getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function getCounts(userId: string) {
  const supabase = await createClient();
  const [{ count: notifications }, { data: conversations }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
    supabase.rpc("get_my_conversations", { p_limit: 100 }),
  ]);
  const unreadMessages = (conversations ?? []).reduce((sum, c) => sum + Number(c.unread_count), 0);
  return { notifications: notifications ?? 0, unreadMessages };
}

export async function SiteHeader() {
  const user = await getSessionUser();
  const counts = user ? await getCounts(user.id) : null;

  const links: { href: string; label: string; badge?: number }[] = user
    ? [
        { href: "/tutors", label: "Find tutors" },
        { href: "/messages", label: "Messages", badge: counts?.unreadMessages },
        { href: "/bookings", label: "Lessons" },
        { href: dashboardPath(user.profile.role), label: "Dashboard" },
        ...(user.profile.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [
        { href: "/tutors", label: "Find tutors" },
        { href: "/become-a-tutor", label: "Become a tutor" },
        { href: "/faq", label: "How it works" },
      ];
  // De-duplicate (admins' dashboard is /admin)
  const navLinks = links.filter((l, i) => links.findIndex((x) => x.href === l.href) === i);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="relative rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {l.label}
              {l.badge ? (
                <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {l.badge}
                  <span className="sr-only"> unread</span>
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell userId={user.id} initialUnread={counts?.notifications ?? 0} />
              <UserMenu name={user.profile.full_name} avatarUrl={user.profile.avatar_url} role={user.profile.role} />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink href="/login" variant="ghost">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup">Get started</ButtonLink>
            </div>
          )}
          <MobileNav
            links={navLinks.map(({ href, label }) => ({ href, label }))}
            signedIn={Boolean(user)}
          />
        </div>
      </div>
    </header>
  );
}
