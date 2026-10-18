import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/app/(auth)/auth-card";
import { LoginForm } from "@/app/(auth)/auth-forms";
import { Alert } from "@/components/ui/primitives";
import { getSessionUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeNextPath(sp.next) : undefined;
  if (await getSessionUser()) redirect(next ?? "/dashboard");

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to message tutors and manage your lessons."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {sp.error ? (
        <Alert tone="danger" className="mb-4">
          That link is invalid or has expired. Please try again.
        </Alert>
      ) : null}
      <LoginForm next={next} />
    </AuthCard>
  );
}
