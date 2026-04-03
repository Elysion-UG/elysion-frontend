import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import React from "react"

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock("@/src/context/AuthContext", () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    role: null,
    logout: vi.fn(),
  }),
}))

vi.mock("@/src/hooks/useCart", () => ({
  useCart: vi.fn().mockReturnValue({ totalItems: 0 }),
}))

vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

vi.mock("@/src/lib/seller-url", () => ({
  sellerUrl: (path: string) => `http://seller.example.com${path}`,
}))

vi.mock("@/src/components/features/auth/LoginModal", () => ({
  default: () => null,
}))

vi.mock("@/src/components/layout/Footer", () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))

// ── Tests ──────────────────────────────────────────────────────────────────────

import PageLayout from "./PageLayout"

describe("PageLayout", () => {
  it("wraps content in a flex column so the footer sticks to the bottom", () => {
    const { container } = render(
      <PageLayout>
        <p>Content</p>
      </PageLayout>
    )

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.classList.contains("flex")).toBe(true)
    expect(wrapper.classList.contains("flex-col")).toBe(true)
    expect(wrapper.classList.contains("min-h-screen")).toBe(true)
  })

  it("gives <main> flex-1 so it expands and pushes the footer down", () => {
    const { container } = render(
      <PageLayout>
        <p>Content</p>
      </PageLayout>
    )

    const main = container.querySelector("main") as HTMLElement
    expect(main.classList.contains("flex-1")).toBe(true)
  })
})
