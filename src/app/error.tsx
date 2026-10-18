"use client";

import { RotateCcw } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { isSupabaseConfigured } from "@/lib/env";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const notConfigured = !isSupabaseConfigured();
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-semibold">{notConfigured ? "Supabase is not configured yet" : "Something went wrong"}</h1>
      <p className="mt-2 max-w-lg text-muted-foreground">
        {notConfigured
          ? "This page needs a database connection. Add your Supabase URL and publishable key to .env.local and restart the server."
          : "We could not load this page. Please try again. If the problem continues, contact support."}
      </p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p> : null}
      <div className="mt-6 flex gap-2">
        <Button onClick={() => retry()}>
          <RotateCcw aria-hidden="true" /> Try again
        </Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </Container>
  );
}
