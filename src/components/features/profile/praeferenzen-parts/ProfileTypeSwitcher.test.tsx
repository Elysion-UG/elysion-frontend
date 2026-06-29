import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProfileTypeSwitcher } from "./ProfileTypeSwitcher"

describe("ProfileTypeSwitcher", () => {
  it("renders all three options and highlights the selected one", () => {
    render(<ProfileTypeSwitcher value="simple" onChange={() => {}} />)
    const selected = screen.getByRole("button", { name: /Einfach/i })
    expect(selected).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /Kein Profil/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
    expect(screen.getByRole("button", { name: /Erweitert/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("invokes onChange with the chosen value", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ProfileTypeSwitcher value="none" onChange={onChange} />)
    await user.click(screen.getByRole("button", { name: /Erweitert/i }))
    expect(onChange).toHaveBeenCalledWith("extended")
  })
})
