import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { LoadingFullPage } from "./LoadingFullPage"

describe("LoadingFullPage", () => {
  it("renders a spinner with the animate-spin class", () => {
    const { container } = render(<LoadingFullPage />)

    const svg = container.querySelector("svg")
    expect(svg).not.toBeNull()
    expect(svg!.classList.contains("animate-spin")).toBe(true)
  })
})
