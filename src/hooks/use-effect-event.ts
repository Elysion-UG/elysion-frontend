import { useCallback, useLayoutEffect, useRef } from "react"

/**
 * Ponyfill for React's `useEffectEvent` (not yet stable in React 18).
 *
 * Returns a referentially-stable function that always calls the latest version
 * of `handler`. Use it to let an Effect trigger imperative work — e.g. an
 * initial data fetch — without re-creating the Effect on every render and
 * without tripping `react-hooks/set-state-in-effect`: the state updates happen
 * inside an Effect Event, not synchronously in the Effect body.
 *
 * @see https://react.dev/learn/separating-events-from-effects
 */
export function useEffectEvent<A extends unknown[], R>(
  handler: (...args: A) => R
): (...args: A) => R {
  const ref = useRef(handler)
  useLayoutEffect(() => {
    ref.current = handler
  })
  return useCallback((...args: A) => ref.current(...args), [])
}
