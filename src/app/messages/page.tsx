import { MessagesSquare } from "lucide-react";

import { Alert } from "@/components/ui/primitives";

export default async function MessagesIndex({ searchParams }: PageProps<"/messages">) {
  const { error } = await searchParams;
  const errorText = typeof error === "string" ? (error === "unknown" ? "That user could not be found." : error) : null;
  return (
    <>
      {errorText ? (
        <div className="p-4 md:hidden">
          <Alert tone="danger">{errorText}</Alert>
        </div>
      ) : null}
      <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-8 text-center md:flex">
        {errorText ? (
          <Alert tone="danger" className="max-w-md text-left">
            {errorText}
          </Alert>
        ) : null}
        <div className="rounded-full bg-muted p-4 text-muted-foreground">
          <MessagesSquare className="size-7" aria-hidden="true" />
        </div>
        <p className="font-medium">Select a conversation</p>
        <p className="max-w-sm text-sm text-muted-foreground">Messages are private between you and the other participant and arrive in real time.</p>
      </div>
    </>
  );
}
