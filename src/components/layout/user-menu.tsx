"use client";

import { Bell, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/primitives";
import type { UserRole } from "@/lib/types";

export function UserMenu({ name, avatarUrl, role }: { name: string; avatarUrl: string | null; role: UserRole }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dashboard = role === "admin" ? "/admin" : role === "tutor" ? "/dashboard/tutor" : "/dashboard/student";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center rounded-full ring-offset-2 hover:ring-2 hover:ring-border"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar src={avatarUrl} name={name} size={36} />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium">{name || "Your account"}</p>
            <p className="text-xs capitalize text-muted-foreground">{role}</p>
          </div>
          <Link role="menuitem" href={dashboard} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
            <LayoutDashboard className="size-4" aria-hidden="true" /> Dashboard
          </Link>
          <Link role="menuitem" href="/notifications" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
            <Bell className="size-4" aria-hidden="true" /> Notifications
          </Link>
          <Link role="menuitem" href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
            <Settings className="size-4" aria-hidden="true" /> Settings
          </Link>
          <form action="/auth/signout" method="post" className="border-t border-border">
            <button role="menuitem" type="submit" className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger hover:bg-danger-soft">
              <LogOut className="size-4" aria-hidden="true" /> Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
