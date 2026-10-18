"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** The browser's IANA time zone ("UTC" during server rendering). */
export function useBrowserTimeZone() {
  return useSyncExternalStore(
    noopSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    () => "UTC",
  );
}

/** True after hydration; lets components render time-zone dependent text safely. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
