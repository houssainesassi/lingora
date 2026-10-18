import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/app/(auth)/auth-card";
import { ResetPasswordForm } from "@/app/(auth)/auth-forms";
import { Alert } from "@/components/ui/primitives";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  return (
    <AuthCard title="Choose a new password">
      {user ? (
        <ResetPasswordForm />
      ) : (
        <Alert tone="warning" title="Reset link required">
          Open the link from your password reset email, or{" "}
          <Link href="/forgot-password" className="underline">
            request a new one
          </Link>
          .
        </Alert>
      )}
    </AuthCard>
  );
}
