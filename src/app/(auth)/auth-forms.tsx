"use client";

import { GraduationCap, Presentation } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { forgotPasswordAction, signInAction, signUpAction, updatePasswordAction } from "@/app/(auth)/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { useBrowserTimeZone } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signInAction, null);
  const fe = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <ActionFeedback state={state} />
      <Field id="email" label="Email" error={fe?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(fe?.email)} />
      </Field>
      <Field id="password" label="Password" error={fe?.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={Boolean(fe?.password)} />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Forgot your password?
        </Link>
      </div>
      <SubmitButton className="w-full" pendingText="Signing in…">
        Log in
      </SubmitButton>
    </form>
  );
}

export function SignUpForm({ defaultRole }: { defaultRole: "student" | "tutor" }) {
  const [state, action] = useActionState(signUpAction, null);
  const [role, setRole] = useState(defaultRole);
  const timezone = useBrowserTimeZone();
  const fe = state?.fieldErrors;

  if (state?.ok) {
    return (
      <Alert tone="success" title="Check your inbox">
        {state.message}
      </Alert>
    );
  }

  const roles = [
    { value: "student" as const, title: "I want to learn", text: "Find tutors and book lessons", icon: GraduationCap },
    { value: "tutor" as const, title: "I want to teach", text: "Create a tutor profile", icon: Presentation },
  ];

  return (
    <form action={action} className="space-y-4" noValidate>
      <ActionFeedback state={state} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">How will you use Lingora?</legend>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => (
            <label
              key={r.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                role === r.value ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-muted",
              )}
            >
              <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="sr-only" />
              <r.icon className="size-5 text-primary" aria-hidden="true" />
              <span className="font-medium">{r.title}</span>
              <span className="text-xs text-muted-foreground">{r.text}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <input type="hidden" name="timezone" value={timezone} />
      <Field id="fullName" label="Full name" error={fe?.fullName}>
        <Input id="fullName" name="fullName" autoComplete="name" required aria-invalid={Boolean(fe?.fullName)} />
      </Field>
      <Field id="email" label="Email" error={fe?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(fe?.email)} />
      </Field>
      <Field id="password" label="Password" hint="At least 8 characters, with a letter and a number." error={fe?.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={Boolean(fe?.password)} aria-describedby="password-hint" />
      </Field>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox name="terms" className="mt-0.5" required aria-invalid={Boolean(fe?.terms)} />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {fe?.terms ? (
          <p className="mt-1 text-xs font-medium text-danger" role="alert">
            {fe.terms[0]}
          </p>
        ) : null}
      </div>
      <SubmitButton className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, null);
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} className="space-y-4" noValidate>
      <ActionFeedback state={state} />
      <Field id="email" label="Email" error={state?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, null);
  if (state?.ok) {
    return (
      <Alert tone="success" title="Password updated">
        You can continue to your{" "}
        <Link className="underline" href="/dashboard">
          dashboard
        </Link>
        .
      </Alert>
    );
  }
  const fe = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4" noValidate>
      <ActionFeedback state={state} />
      <Field id="password" label="New password" hint="At least 8 characters, with a letter and a number." error={fe?.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field id="confirm" label="Confirm new password" error={fe?.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Saving…">
        Update password
      </SubmitButton>
    </form>
  );
}
