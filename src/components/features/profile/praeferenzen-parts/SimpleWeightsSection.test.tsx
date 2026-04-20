import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SimpleWeightsSection } from "./SimpleWeightsSection"
import { defaultSimpleWeights, PREFERENCE_CATEGORIES } from "./preferences-constants"

describe("SimpleWeightsSection", () => {
  it("renders a slider per category", () => {
    render(<SimpleWeightsSection weights={defaultSimpleWeights()} onChange={() => {}} />)
    const sliders = screen.getAllByRole("slider")
    expect(sliders).toHaveLength(PREFERENCE_CATEGORIES.length)
  })

  it("emits onChange with the category id and new value", () => {
    const onChange = vi.fn()
    render(<SimpleWeightsSection weights={defaultSimpleWeights()} onChange={onChange} />)
    const firstSlider = screen.getAllByRole("slider")[0]
    fireEvent.change(firstSlider, { target: { value: "75" } })
    expect(onChange).toHaveBeenCalledWith(PREFERENCE_CATEGORIES[0].id, 75)
  })
})
