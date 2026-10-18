import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/app/(auth)/auth-card";
import { ForgotPasswordForm } from "@/app/(auth)/auth-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we will send you a link to choose a new password."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
