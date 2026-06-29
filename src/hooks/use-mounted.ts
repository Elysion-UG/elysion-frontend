import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

/**
 * Returns `false` during server render and the first client render, then `true`
 * once mounted on the client. Use to guard against hydration mismatches for
 * client-only UI without a `useState` + `useEffect(setState)` pair (which trips
 * `react-hooks/set-state-in-effect`).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
