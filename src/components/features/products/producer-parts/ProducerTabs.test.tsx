import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProducerTabs } from "./ProducerTabs"
import type { ProducerTab } from "./useProducerTabs"

const tabs: { id: ProducerTab; label: string }[] = [
  { id: "about", label: "Über uns" },
  { id: "products", label: "Produkte" },
  { id: "sustainability", label: "Nachhaltigkeit" },
]

describe("ProducerTabs", () => {
  it("marks the active tab with aria-selected", () => {
    render(<ProducerTabs tabs={tabs} activeTab="products" onChange={() => {}} />)
    expect(screen.getByRole("tab", { name: "Produkte" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Über uns" })).toHaveAttribute("aria-selected", "false")
  })

  it("calls onChange with the clicked tab id", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ProducerTabs tabs={tabs} activeTab="about" onChange={onChange} />)
    await user.click(screen.getByRole("tab", { name: "Nachhaltigkeit" }))
    expect(onChange).toHaveBeenCalledWith("sustainability")
  })
})
