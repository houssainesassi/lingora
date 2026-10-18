import type { ReactNode } from "react";

import { Container } from "@/components/ui/primitives";

export function ContentPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <Container className="max-w-3xl py-14">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {intro ? <p className="mt-3 text-lg text-muted-foreground">{intro}</p> : null}
      <div className="mt-8 space-y-6 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted-foreground">{children}</div>
    </Container>
  );
}
