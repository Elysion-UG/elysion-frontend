import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mockBack = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack }),
}))

import { BackButton } from "./BackButton"

describe("BackButton", () => {
  it('renders default label "Zurück"', () => {
    render(<BackButton />)

    expect(screen.getByRole("button", { name: /Zurück/ })).toBeInTheDocument()
  })

  it("renders a custom label", () => {
    render(<BackButton label="Go back" />)

    expect(screen.getByRole("button", { name: /Go back/ })).toBeInTheDocument()
  })

  it("calls router.back() on click", async () => {
    const user = userEvent.setup()
    render(<BackButton />)

    await user.click(screen.getByRole("button"))

    expect(mockBack).toHaveBeenCalledOnce()
  })
})
