import { setUserRoleAction, setUserSuspendedAction } from "@/app/admin/actions";
import { Input, Select } from "@/components/ui/form";
import { Avatar, Badge, EmptyState } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { countryName, formatRelative } from "@/lib/utils";

export const metadata = { title: "Users" };

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const me = await requireRole("admin", "/admin/users");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const role = typeof sp.role === "string" && ["student", "tutor", "admin"].includes(sp.role) ? (sp.role as "student" | "tutor" | "admin") : undefined;

  const supabase = await createClient();
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.ilike("full_name", `%${q.replace(/[%_]/g, "")}%`);
  if (role) query = query.eq("role", role);
  const { data: users } = await query;

  return (
    <div>
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <label htmlFor="q" className="sr-only">
          Search by name
        </label>
        <Input id="q" name="q" defaultValue={q} placeholder="Search by name" className="max-w-xs" />
        <label htmlFor="role" className="sr-only">
          Role
        </label>
        <Select id="role" name="role" defaultValue={role ?? ""} className="max-w-40">
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="tutor">Tutors</option>
          <option value="admin">Admins</option>
        </Select>
        <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-white">
          Search
        </button>
      </form>
      {(users ?? []).length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">User</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Joined</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(users ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar_url} name={u.full_name} size={32} />
                      <div>
                        <p className="font-medium">{u.full_name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{countryName(u.country) ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.id === me.id ? (
                      <Badge tone="primary">admin (you)</Badge>
                    ) : (
                      <form action={setUserRoleAction} className="flex items-center gap-1">
                        <input type="hidden" name="userId" value={u.id} />
                        <label htmlFor={`role-${u.id}`} className="sr-only">
                          Role for {u.full_name}
                        </label>
                        <Select id={`role-${u.id}`} name="role" defaultValue={u.role} className="h-8 w-28 text-xs">
                          <option value="student">student</option>
                          <option value="tutor">tutor</option>
                          <option value="admin">admin</option>
                        </Select>
                        <SubmitButton size="sm" variant="ghost">
                          Save
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRelative(u.created_at)}</td>
                  <td className="px-4 py-3">{u.is_suspended ? <Badge tone="danger">Suspended</Badge> : <Badge tone="success">Active</Badge>}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== me.id ? (
                      <form action={setUserSuspendedAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="suspended" value={u.is_suspended ? "false" : "true"} />
                        <SubmitButton size="sm" variant={u.is_suspended ? "secondary" : "danger-outline"}>
                          {u.is_suspended ? "Reactivate" : "Suspend"}
                        </SubmitButton>
                      </form>
                    ) : null}
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
