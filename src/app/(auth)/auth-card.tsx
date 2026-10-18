import type { ReactNode } from "react";

import { Card } from "@/components/ui/primitives";

export function AuthCard({ title, description, children, footer }: { title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 border-t border-border pt-4 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </Card>
  );
}
