import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/app/(auth)/auth-card";
import { SignUpForm } from "@/app/(auth)/auth-forms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  if (await getSessionUser()) redirect("/dashboard");
  const sp = await searchParams;
  const role = sp.role === "tutor" ? "tutor" : "student";

  return (
    <AuthCard
      title="Create your account"
      description="Free to join. Learn or teach languages through real conversations."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignUpForm defaultRole={role} />
    </AuthCard>
  );
}
