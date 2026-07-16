import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { useFocusTrap } from "./useFocusTrap"

function Modal({ onEscape }: { onEscape?: () => void }) {
  const ref = useFocusTrap(onEscape)
  return (
    <div ref={ref} role="dialog" aria-modal="true">
      <button>first</button>
      <button>middle</button>
      <button>last</button>
    </div>
  )
}

describe("useFocusTrap (#42)", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("moves focus to the first focusable element on mount", () => {
    render(<Modal />)
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus()
  })

  it("calls onEscape when Escape is pressed", () => {
    const onEscape = vi.fn()
    render(<Modal onEscape={onEscape} />)
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it("wraps Tab from the last element back to the first", () => {
    render(<Modal />)
    const last = screen.getByRole("button", { name: "last" })
    last.focus()
    expect(last).toHaveFocus()

    fireEvent.keyDown(document, { key: "Tab" })
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus()
  })

  it("wraps Shift+Tab from the first element to the last", () => {
    render(<Modal />)
    const first = screen.getByRole("button", { name: "first" })
    first.focus()

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true })
    expect(screen.getByRole("button", { name: "last" })).toHaveFocus()
  })

  it("restores focus to the previously focused element on unmount", () => {
    const outside = document.createElement("button")
    outside.textContent = "outside"
    document.body.appendChild(outside)
    outside.focus()
    expect(outside).toHaveFocus()

    const { unmount } = render(<Modal />)
    // Focus moved into the modal …
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus()

    unmount()
    // … and is restored to where it was before.
    expect(outside).toHaveFocus()
  })
})
