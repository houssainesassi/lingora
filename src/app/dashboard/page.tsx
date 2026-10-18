import { redirect } from "next/navigation";

import { dashboardPath, requireUser } from "@/lib/auth";

export default async function DashboardRouter() {
  const user = await requireUser("/dashboard");
  redirect(dashboardPath(user.profile.role));
}
