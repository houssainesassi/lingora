import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you are looking for does not exist or you do not have access to it.</p>
      <div className="mt-6 flex gap-2">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/tutors" variant="secondary">
          Find tutors
        </ButtonLink>
      </div>
    </Container>
  );
}
