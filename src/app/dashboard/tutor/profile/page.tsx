import { FileText, Trash2 } from "lucide-react";

import { removeTutorDocumentAction, removeTutorLanguageAction } from "@/app/dashboard/tutor/actions";
import { TutorLanguageForm } from "@/app/dashboard/tutor/profile/tutor-languages-form";
import { TutorProfileForm } from "@/app/dashboard/tutor/profile/tutor-profile-form";
import { TutorStatusAlert } from "@/app/dashboard/tutor/status-alert";
import { AvatarUpload, TutorDocumentUpload } from "@/components/file-upload";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, Card, CardHeader, Container, PageHeader } from "@/components/ui/primitives";
import { requireRole } from "@/lib/auth";
import { getLanguages } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { tutorCompletion } from "@/lib/tutor-completion";

export const metadata = { title: "Edit tutor profile" };

export default async function TutorProfileEditPage({ searchParams }: PageProps<"/dashboard/tutor/profile">) {
  const user = await requireRole("tutor", "/dashboard/tutor/profile");
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: tutor }, { data: tutorLangs }, languages, { count: availabilityCount }, { data: docs }] = await Promise.all([
    supabase.from("tutor_profiles").select("*").eq("id", user.id).single(),
    supabase.from("tutor_languages").select("language_code, teaches, is_native, proficiency, language:languages(name)").eq("tutor_id", user.id),
    getLanguages(),
    supabase.from("tutor_availability").select("id", { count: "exact", head: true }).eq("tutor_id", user.id),
    supabase.storage.from("tutor-documents").list(user.id, { limit: 20 }),
  ]);
  if (!tutor) throw new Error("Tutor profile missing");

  const completion = tutorCompletion({
    tutor,
    avatarUrl: user.profile.avatar_url,
    country: user.profile.country,
    teachesCount: (tutorLangs ?? []).filter((l) => l.teaches).length,
    availabilityCount: availabilityCount ?? 0,
  });

  return (
    <Container className="max-w-4xl py-10">
      <PageHeader
        title="Your tutor profile"
        description="This is what students see when they find you."
        action={
          <ButtonLink href={`/tutors/${user.id}`} variant="secondary">
            Preview public profile
          </ButtonLink>
        }
      />
      {sp.welcome ? (
        <Alert tone="info" className="mb-6" title="Welcome, tutor">
          Fill in your profile, add the languages you teach and set your availability. Then submit your profile for review.
        </Alert>
      ) : null}

      <div className="space-y-6">
        <TutorStatusAlert status={tutor.status} rejectionReason={tutor.rejection_reason} canSubmit={completion.canSubmit} />

        <Card>
          <CardHeader title="Profile photo" description="A friendly, clear photo of your face helps students choose you." />
          <div className="p-5">
            <AvatarUpload userId={user.id} name={user.profile.full_name} avatarUrl={user.profile.avatar_url} />
            <p className="mt-3 text-xs text-muted-foreground">
              Name, country and time zone are edited in{" "}
              <a href="/settings" className="text-primary underline">
                account settings
              </a>
              .
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Languages" description="Mark the languages you teach and those you speak natively." />
          <div className="space-y-4 p-5">
            {(tutorLangs ?? []).length > 0 ? (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {(tutorLangs ?? []).map((l) => (
                  <li key={l.language_code} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                    <span className="font-medium">{l.language?.name ?? l.language_code}</span>
                    {l.teaches ? <Badge tone="primary">Teaches</Badge> : null}
                    {l.is_native ? <Badge tone="success">Native</Badge> : <Badge>{l.proficiency}</Badge>}
                    <form action={removeTutorLanguageAction} className="ml-auto">
                      <input type="hidden" name="language" value={l.language_code} />
                      <button type="submit" className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${l.language?.name ?? l.language_code}`}>
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No languages yet.</p>
            )}
            <TutorLanguageForm languages={languages.map((l) => ({ code: l.code, name: l.name }))} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Teaching details" />
          <div className="p-5">
            <TutorProfileForm tutor={tutor} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Certificates (private)" description="Optional. Only you and administrators can see these files. They help us verify your application." action={<TutorDocumentUpload userId={user.id} />} />
          <div className="p-5">
            {(docs ?? []).filter((d) => d.id).length > 0 ? (
              <ul className="space-y-2">
                {(docs ?? [])
                  .filter((d) => d.id)
                  .map((d) => (
                    <li key={d.name} className="flex items-center gap-2 text-sm">
                      <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate">{d.name.replace(/^\d+-/, "")}</span>
                      <form action={removeTutorDocumentAction} className="ml-auto">
                        <input type="hidden" name="name" value={d.name} />
                        <button type="submit" className="text-xs text-danger hover:underline">
                          Delete
                        </button>
                      </form>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
}
