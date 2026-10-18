import { CalendarCheck, CalendarClock, Flag, GraduationCap, Hourglass, MessageSquare, UserCheck, Users } from "lucide-react";
import Link from "next/link";

import { Alert, StatCard } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin overview" };

export default async function AdminOverview() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_platform_stats");
  if (error || !data) return <Alert tone="danger">Could not load statistics.</Alert>;
  const s = data as Record<string, number>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Students" value={s.students} icon={<Users />} />
        <StatCard label="Approved tutors" value={s.tutors_approved} icon={<UserCheck />} />
        <StatCard label="Pending applications" value={<Link href="/admin/tutors" className="hover:underline">{s.tutors_pending}</Link>} icon={<Hourglass />} />
        <StatCard label="Open reports" value={<Link href="/admin/reports" className="hover:underline">{s.reports_open}</Link>} icon={<Flag />} />
        <StatCard label="All bookings" value={s.bookings_total} icon={<CalendarClock />} />
        <StatCard label="Pending requests" value={s.bookings_pending} icon={<GraduationCap />} />
        <StatCard label="Upcoming lessons" value={s.bookings_upcoming} icon={<CalendarCheck />} />
        <StatCard label="Messages (7 days)" value={s.messages_7d} icon={<MessageSquare />} />
      </div>
      <Alert tone="info" title="Admin access">
        Admin rights cannot be self-assigned. Promote another administrator from the Users page, or with SQL as described in the README.
      </Alert>
    </div>
  );
}
