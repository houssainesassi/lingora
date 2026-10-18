import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/app/onboarding/onboarding-form";
import { CountrySelect, TimeZoneSelect } from "@/components/profile-fields";
import { Card } from "@/components/ui/primitives";
import { dashboardPath, requireUser } from "@/lib/auth";
import { getLanguages } from "@/lib/data";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding", { allowIncomplete: true });
  if (user.profile.onboarded) redirect(dashboardPath(user.profile.role));
  const languages = await getLanguages();

  return (
    <div className="flex flex-1 justify-center bg-gradient-to-b from-primary-soft/60 to-background px-4 py-12">
      <Card className="w-full max-w-xl p-6 sm:p-8">
        <p className="text-sm font-medium text-primary">Welcome to Lingora</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Let’s set up your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">This takes less than a minute. You can change everything later in settings.</p>
        <OnboardingForm
          defaultName={user.profile.full_name}
          defaultRole={user.profile.role === "tutor" ? "tutor" : "student"}
          isAdmin={user.profile.role === "admin"}
          languages={languages.map((l) => ({ code: l.code, name: l.name }))}
          countryField={<CountrySelect defaultValue={user.profile.country} />}
          timezoneField={<TimeZoneSelect defaultValue={user.profile.timezone} />}
        />
      </Card>
    </div>
  );
}
