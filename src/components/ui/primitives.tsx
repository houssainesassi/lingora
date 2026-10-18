import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";

import { cn, initials } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-border bg-card shadow-sm", className)} {...props} />;
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4", className)}>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "bg-muted text-muted-foreground",
      primary: "bg-primary-soft text-primary",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
      accent: "bg-accent-soft text-[#b4401f]",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Avatar({ src, name, size = 48, className }: { src?: string | null; name?: string | null; size?: number; className?: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name ? `Photo of ${name}` : "Profile photo"}
        width={size}
        height={size}
        // Avatars are already resized on upload and served from Supabase
        // Storage, so we skip the optimiser (works with local Supabase too).
        unoptimized
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-soft to-accent-soft font-semibold text-primary",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(12, size / 2.8) }}
    >
      {initials(name)}
    </span>
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-muted", className)} {...props} />;
}

const alertIcons = { info: Info, success: CheckCircle2, warning: TriangleAlert, danger: AlertCircle };
const alertTones = {
  info: "border-primary/20 bg-primary-soft text-[#312e81]",
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/20 bg-warning-soft text-warning",
  danger: "border-danger/20 bg-danger-soft text-danger",
};

export function Alert({ tone = "info", title, children, className }: { tone?: keyof typeof alertTones; title?: ReactNode; children?: ReactNode; className?: string }) {
  const Icon = alertIcons[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", alertTones[tone], className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center", className)}>
      {icon ? <div className="rounded-full bg-muted p-3 text-muted-foreground [&_svg]:size-6">{icon}</div> : null}
      <div>
        <p className="font-semibold">{title}</p>
        {description ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <p className="text-sm">{label}</p>
        {icon ? <span className="[&_svg]:size-4">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}
