import Link from "next/link";

import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { BOOKING_SELECT, type BookingWithPeople } from "@/components/bookings/booking-list";
import { EmptyState } from "@/components/ui/primitives";
import { requireRole } from "@/lib/auth";
import { BOOKING_STATUS_LABEL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/types";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";

export const metadata = { title: "Bookings" };

export default async function AdminBookings({ searchParams }: PageProps<"/admin/bookings">) {
  const me = await requireRole("admin", "/admin/bookings");
  const sp = await searchParams;
  const status = (Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).find((s) => s === sp.status);
  const supabase = await createClient();
  let q = supabase.from("bookings").select(BOOKING_SELECT).order("starts_at", { ascending: false }).limit(100);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const bookings = (data ?? []) as unknown as BookingWithPeople[];

  return (
    <div>
      <nav aria-label="Status" className="mb-4 flex flex-wrap gap-1">
        <Link href="/admin/bookings" className={cn("rounded-lg px-3 py-1.5 text-sm", !status ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
          All
        </Link>
        {(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((s) => (
          <Link key={s} href={`/admin/bookings?status=${s}`} className={cn("rounded-lg px-3 py-1.5 text-sm capitalize", s === status ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
            {s}
          </Link>
        ))}
      </nav>
      {bookings.length === 0 ? (
        <EmptyState title="No bookings" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">When ({me.profile.timezone})</th>
                <th scope="col" className="px-4 py-3">Student</th>
                <th scope="col" className="px-4 py-3">Tutor</th>
                <th scope="col" className="px-4 py-3">Lesson</th>
                <th scope="col" className="px-4 py-3">Price</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 tabular-nums">
                    <Link href={`/bookings/${b.id}`} className="hover:underline">
                      {formatDateTime(b.starts_at, me.profile.timezone, { year: "numeric" })}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{b.student?.full_name}</td>
                  <td className="px-4 py-3">{b.tutor?.profile?.full_name}</td>
                  <td className="px-4 py-3">
                    {b.language?.name} · {b.duration_minutes} min
                  </td>
                  <td className="px-4 py-3">{formatPrice(b.price_cents, b.currency)}</td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
