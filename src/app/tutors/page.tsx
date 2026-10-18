import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TutorFiltersForm } from "@/app/tutors/tutor-filters";
import { TutorCard } from "@/components/tutors/tutor-card";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Alert, Container, EmptyState } from "@/components/ui/primitives";
import { getSessionUser } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { getLanguages } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { filtersToQuery, parseTutorFilters, toSearchArgs } from "@/lib/tutor-search";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Find a language tutor",
  description: "Browse approved language tutors and native speakers. Filter by language, level, price and more.",
};

export default async function TutorsPage({ searchParams }: PageProps<"/tutors">) {
  const filters = parseTutorFilters(await searchParams);
  const { page, args } = toSearchArgs(filters);

  const supabase = await createClient();
  const [user, languages, search] = await Promise.all([getSessionUser(), getLanguages(), supabase.rpc("search_tutors", args)]);

  const tutors = search.data ?? [];
  const total = tutors.length > 0 ? Number(tutors[0].total_count) : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  let favoriteIds = new Set<string>();
  if (user && tutors.length > 0) {
    const { data } = await supabase.from("favorites").select("tutor_id").eq("student_id", user.id).in("tutor_id", tutors.map((t) => t.id));
    favoriteIds = new Set((data ?? []).map((f) => f.tutor_id));
  }

  const languageName = languages.find((l) => l.code === filters.teaches)?.name;
  const hasFilters = Object.entries(filters).some(([k, v]) => k !== "page" && k !== "sort" && v !== undefined);

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{languageName ? `${languageName} tutors` : "Find your tutor"}</h1>
        <p className="mt-1 text-muted-foreground">Only tutors approved by our team are listed. Ratings come from verified, completed lessons.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label="Filters">
          <TutorFiltersForm filters={filters} languages={languages.map((l) => ({ code: l.code, name: l.name }))} />
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="results-heading" className="text-sm text-muted-foreground" aria-live="polite">
              {search.error ? "Search unavailable" : `${total} tutor${total === 1 ? "" : "s"} found`}
            </h2>
          </div>

          {search.error ? (
            <Alert tone="danger" title="We could not load tutors">
              Please refresh the page. If the problem continues, check that the database migrations have been applied.
            </Alert>
          ) : tutors.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="No tutors match these filters"
              description={hasFilters ? "Try removing a filter or widening the price range." : "No tutors have been approved yet. Check back soon."}
              action={
                hasFilters ? (
                  <ButtonLink href="/tutors" variant="secondary">
                    Clear filters
                  </ButtonLink>
                ) : null
              }
            />
          ) : (
            <ul className="space-y-4">
              {tutors.map((t) => (
                <li key={t.id}>
                  <TutorCard tutor={t} isFavorite={favoriteIds.has(t.id)} viewerId={user?.id ?? null} />
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 ? (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-2">
              <PageLink disabled={page <= 1} href={`/tutors${filtersToQuery(filters, { page: page - 1 })}`}>
                <ChevronLeft aria-hidden="true" /> Previous
              </PageLink>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <PageLink disabled={page >= totalPages} href={`/tutors${filtersToQuery(filters, { page: page + 1 })}`}>
                Next <ChevronRight aria-hidden="true" />
              </PageLink>
            </nav>
          ) : null}
        </section>
      </div>
    </Container>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(buttonVariants({ variant: "secondary" }), "opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={buttonVariants({ variant: "secondary" })}>
      {children}
    </Link>
  );
}
