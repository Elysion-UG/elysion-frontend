import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RouteErrorFallback } from "./RouteErrorFallback"
import { errorStore } from "@/src/lib/error-store"

describe("RouteErrorFallback", () => {
  beforeEach(() => {
    errorStore.clear()
  })

  it("reports the rendered error with routeGroup metadata", () => {
    const err = Object.assign(new Error("Boom"), { digest: "abc" })
    render(
      <RouteErrorFallback
        error={err}
        reset={() => {}}
        routeGroup="seller"
        homeHref="/seller/dashboard"
        homeLabel="Dashboard"
      />
    )
    const events = errorStore.getAll()
    expect(events.length).toBe(1)
    expect(events[0].category).toBe("render")
    expect(events[0].metadata.routeGroup).toBe("seller")
    expect(events[0].metadata.digest).toBe("abc")
  })

  it("invokes reset when the retry button is clicked", async () => {
    const reset = vi.fn()
    const user = userEvent.setup()
    render(
      <RouteErrorFallback
        error={new Error("Boom")}
        reset={reset}
        routeGroup="public"
        homeHref="/"
        homeLabel="Startseite"
      />
    )
    await user.click(screen.getByRole("button", { name: /erneut versuchen/i }))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it("renders the home link with the provided label", () => {
    render(
      <RouteErrorFallback
        error={new Error("x")}
        reset={() => {}}
        routeGroup="admin"
        homeHref="/admin/users"
        homeLabel="Admin-Startseite"
        theme="dark"
      />
    )
    const link = screen.getByRole("link", { name: /admin-startseite/i })
    expect(link).toHaveAttribute("href", "/admin/users")
  })
})
