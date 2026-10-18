import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/ui/primitives";
import { requireRole } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/tutors", label: "Tutor applications" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/languages", label: "Languages" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin", "/admin");
  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Admin</h1>
        <nav aria-label="Admin" className="flex flex-wrap gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </Container>
  );
}
