import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-lg font-semibold tracking-tight" aria-label={`${APP_NAME} home`}>
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-sm">
        L
      </span>
      <span className="text-lg">{APP_NAME}</span>
    </Link>
  );
}
