import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SellerCard } from "./SellerCard"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }))

describe("SellerCard — producer link (Elysion-UG/elysion-marketplace-backend#104)", () => {
  beforeEach(() => vi.clearAllMocks())

  const card = () => screen.getByRole("button", { name: /Verifizierter Verkäufer/ })

  it("routes to ?slug= when the seller is APPROVED", async () => {
    render(
      <SellerCard sellerName="Alpha Manufaktur" sellerUserId="s1" sellerSlug="alpha-manufaktur" />
    )
    await userEvent.click(card())
    expect(mockPush).toHaveBeenCalledWith("/producer?slug=alpha-manufaktur")
  })

  it("routes to ?id= when the slug is null — the seller is not APPROVED", async () => {
    render(<SellerCard sellerName="Alpha Manufaktur" sellerUserId="s1" sellerSlug={null} />)
    await userEvent.click(card())
    expect(mockPush).toHaveBeenCalledWith("/producer?id=s1")
  })

  it("routes to ?id= when no slug prop is passed at all", async () => {
    render(<SellerCard sellerName="Alpha Manufaktur" sellerUserId="s1" />)
    await userEvent.click(card())
    expect(mockPush).toHaveBeenCalledWith("/producer?id=s1")
  })

  it("does not navigate when neither slug nor seller id is known", async () => {
    render(<SellerCard sellerName="Alpha Manufaktur" />)
    await userEvent.click(card())
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("navigates on keyboard activation too", async () => {
    render(
      <SellerCard sellerName="Alpha Manufaktur" sellerUserId="s1" sellerSlug="alpha-manufaktur" />
    )
    card().focus()
    await userEvent.keyboard("{Enter}")
    expect(mockPush).toHaveBeenCalledWith("/producer?slug=alpha-manufaktur")
  })
})
