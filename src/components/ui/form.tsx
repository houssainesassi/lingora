import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-xs placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring/40 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-10 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

/** Label + control + hint/error, wired up with aria attributes. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string[] | string;
  children: ReactNode;
  className?: string;
}) {
  const errorText = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !errorText ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {errorText ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger" role="alert">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return <input type="checkbox" className={cn("size-4 rounded border-border accent-primary", className)} {...props} />;
}
