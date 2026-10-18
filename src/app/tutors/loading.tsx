import { Container, Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <Container className="py-10" aria-busy="true" aria-label="Loading tutors">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <Skeleton className="hidden h-[640px] lg:block" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <Skeleton className="size-22 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-72" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
