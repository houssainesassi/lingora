import { toggleLanguageAction } from "@/app/admin/actions";
import { AddLanguageForm } from "@/app/admin/languages/add-language-form";
import { Badge, Card, CardHeader } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Languages" };

export default async function AdminLanguages() {
  const supabase = await createClient();
  const { data: languages } = await supabase.from("languages").select("*").order("sort_order").order("name");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="Supported languages" description="Inactive languages are hidden from filters and forms but keep existing data." />
        <ul className="divide-y divide-border">
          {(languages ?? []).map((l) => (
            <li key={l.code} className="flex items-center gap-3 px-5 py-3 text-sm">
              <code className="w-14 text-muted-foreground">{l.code}</code>
              <span className="font-medium">{l.name}</span>
              <span className="text-muted-foreground">{l.native_name}</span>
              <span className="ml-auto">{l.is_active ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}</span>
              <form action={toggleLanguageAction}>
                <input type="hidden" name="code" value={l.code} />
                <input type="hidden" name="active" value={l.is_active ? "false" : "true"} />
                <SubmitButton size="sm" variant="ghost">
                  {l.is_active ? "Deactivate" : "Activate"}
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="Add a language" />
        <div className="p-5">
          <AddLanguageForm />
        </div>
      </Card>
    </div>
  );
}
