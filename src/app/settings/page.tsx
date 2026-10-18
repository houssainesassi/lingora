import { switchRoleAction } from "@/app/settings/actions";
import { ProfileForm } from "@/app/settings/profile-form";
import { CountrySelect, TimeZoneSelect } from "@/components/profile-fields";
import { AvatarUpload } from "@/components/file-upload";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, Container, PageHeader } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const p = user.profile;

  return (
    <Container className="max-w-3xl py-10">
      <PageHeader title="Account settings" description={user.email ?? undefined} />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Profile photo" />
          <div className="p-5">
            <AvatarUpload userId={user.id} name={p.full_name} avatarUrl={p.avatar_url} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Personal details" />
          <div className="p-5">
            <ProfileForm
              defaultName={p.full_name}
              defaultBio={p.bio ?? ""}
              countryField={<CountrySelect defaultValue={p.country} />}
              timezoneField={<TimeZoneSelect defaultValue={p.timezone} />}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Password" />
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
            <p className="text-muted-foreground">We will email you a secure link to choose a new password.</p>
            <ButtonLink href="/forgot-password" variant="secondary">
              Change password
            </ButtonLink>
          </div>
        </Card>

        {p.role !== "admin" ? (
          <Card>
            <CardHeader title="Account type" description={`You are currently using Lingora as a ${p.role}.`} />
            <form action={switchRoleAction} className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
              <input type="hidden" name="role" value={p.role === "tutor" ? "student" : "tutor"} />
              <p className="max-w-md text-muted-foreground">
                {p.role === "tutor"
                  ? "Switching to a student account hides your tutor dashboard. Your tutor profile is kept but you will not be able to accept lessons while switched."
                  : "Want to teach? Switch to a tutor account to create a tutor profile. New tutor profiles are reviewed before they are public."}
              </p>
              <SubmitButton variant="secondary" pendingText="Switching…">
                {p.role === "tutor" ? "Switch to student" : "Become a tutor"}
              </SubmitButton>
            </form>
          </Card>
        ) : null}

        <Card>
          <CardHeader title="Sign out" />
          <form action="/auth/signout" method="post" className="p-5">
            <button type="submit" className="inline-flex h-10 items-center rounded-xl border border-danger/30 px-4 text-sm font-medium text-danger hover:bg-danger-soft">
              Log out of this device
            </button>
          </form>
        </Card>
      </div>
    </Container>
  );
}
