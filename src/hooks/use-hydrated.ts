import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True once the component has hydrated on the client, false during SSR and
 * the initial client render. Use this to gate reads of client-only state
 * (localStorage-backed stores, `window`, etc.) so the first paint matches
 * the server-rendered markup and React doesn't report a hydration mismatch.
 *
 * Implemented with `useSyncExternalStore` (server snapshot always `false`,
 * client snapshot always `true`) rather than `useState` + `useEffect`, so it
 * doesn't trigger the "don't setState synchronously in an effect" lint rule.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
