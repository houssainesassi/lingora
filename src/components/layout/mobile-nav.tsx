"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";

export function MobileNav({ links, signedIn }: { links: { href: string; label: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  // Close the menu after navigation.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
        {open ? <X /> : <Menu />}
      </Button>
      {open ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-16 border-b border-border bg-background px-4 pb-5 pt-2 shadow-lg">
          <nav aria-label="Mobile" className="flex flex-col">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-3 text-base hover:bg-muted">
                {l.label}
              </Link>
            ))}
          </nav>
          {!signedIn ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ButtonLink href="/login" variant="secondary">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup">Get started</ButtonLink>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
