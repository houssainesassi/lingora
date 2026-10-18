import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/lib/constants";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/tutors", label: "Find a tutor" },
      { href: "/tutors?teaches=en", label: "English tutors" },
      { href: "/tutors?teaches=es", label: "Spanish tutors" },
      { href: "/tutors?teaches=de", label: "German tutors" },
    ],
  },
  {
    title: "Teach",
    links: [
      { href: "/become-a-tutor", label: "Become a tutor" },
      { href: "/signup?role=tutor", label: "Apply now" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Learn languages through real conversations with tutors and native speakers.
          </p>
        </div>
        {columns.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-semibold">{c.title}</h2>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
