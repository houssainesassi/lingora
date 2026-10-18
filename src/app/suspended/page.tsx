import { Container } from "@/components/ui/primitives";

export const metadata = { title: "Account suspended" };

export default function SuspendedPage() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-semibold">Your account is suspended</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        An administrator has suspended this account. If you think this is a mistake, please reach out through the contact page.
      </p>
      <form action="/auth/signout" method="post" className="mt-6">
        <button type="submit" className="text-sm text-primary underline">
          Log out
        </button>
      </form>
    </Container>
  );
}
