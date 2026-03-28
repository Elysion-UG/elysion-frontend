import { ApiError } from "./api-client"

describe("ApiError", () => {
  it("creates error with status and message", () => {
    const err = new ApiError(404, "Not Found", null)
    expect(err.status).toBe(404)
    expect(err.message).toBe("Not Found")
    expect(err instanceof Error).toBe(true)
  })

  it("creates error with body", () => {
    const body = { detail: "Resource not found" }
    const err = new ApiError(404, "Not Found", body)
    expect(err.body).toEqual(body)
  })
})
