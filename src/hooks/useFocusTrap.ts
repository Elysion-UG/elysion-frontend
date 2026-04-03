import { useEffect, useRef } from "react"

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps keyboard focus within a modal/dialog container.
 *
 * - Focuses the first focusable element when the component mounts.
 * - Cycles Tab / Shift+Tab within the container (no escaping to the background).
 * - Calls `onEscape` when the user presses Escape.
 * - Restores focus to the previously focused element when the component unmounts.
 *
 * Usage:
 *   const modalRef = useFocusTrap(onClose)
 *   <div ref={modalRef} role="dialog" aria-modal="true" ...>
 *
 * WCAG 2.1: SC 2.1.1 (Keyboard), SC 2.1.2 (No Keyboard Trap), SC 2.4.3 (Focus Order)
 * BFSG: Barrierefreiheitsstärkungsgesetz (ab 28.06.2025)
 */
export function useFocusTrap(onEscape?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Keep onEscape stable inside the effect without re-registering the listener.
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Remember who had focus before the modal opened so we can restore it.
    const previousFocus = document.activeElement as HTMLElement | null

    const getFocusable = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

    // Move focus into the modal immediately.
    const focusable = getFocusable()
    if (focusable.length > 0) {
      focusable[0].focus()
    } else {
      // Nothing focusable found — make the container itself focusable as fallback.
      container.setAttribute("tabindex", "-1")
      container.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onEscapeRef.current?.()
        return
      }

      if (e.key !== "Tab") return

      const items = getFocusable()
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]

      if (e.shiftKey) {
        // Shift+Tab on first element → jump to last
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab on last element → jump to first
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      // Restore focus to where it was before the modal opened.
      previousFocus?.focus()
    }
  }, []) // intentionally empty — runs only on mount/unmount

  return containerRef
}
