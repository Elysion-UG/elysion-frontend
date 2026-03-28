import { describe, it, expect, vi, beforeEach } from "vitest"
import { UserService } from "./user.service"

vi.mock("@/src/lib/api-client", () => ({
  apiRequest: vi.fn(),
}))

import { apiRequest } from "@/src/lib/api-client"
const mockApiRequest = vi.mocked(apiRequest)

const mockUser = {
  id: "usr_1",
  email: "max@example.com",
  firstName: "Max",
  lastName: "Mustermann",
  role: "BUYER" as const,
  status: "ACTIVE" as const,
  createdAt: "2024-01-15T10:00:00Z",
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("UserService", () => {
  // ── getCurrentUser ────────────────────────────────────────────────────

  describe("getCurrentUser", () => {
    it("calls GET /api/v1/users/me and returns the user", async () => {
      mockApiRequest.mockResolvedValueOnce(mockUser)
      const user = await UserService.getCurrentUser()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me")
      expect(user).toEqual(mockUser)
    })
  })

  // ── updateProfile ─────────────────────────────────────────────────────

  describe("updateProfile", () => {
    it("calls PATCH /api/v1/users/me with the provided data", async () => {
      const updated = { ...mockUser, firstName: "Hans", lastName: "Gruber" }
      mockApiRequest.mockResolvedValueOnce(updated)
      const result = await UserService.updateProfile({ firstName: "Hans", lastName: "Gruber" })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify({ firstName: "Hans", lastName: "Gruber" }),
      })
      expect(result.firstName).toBe("Hans")
    })

    it("includes phone when provided", async () => {
      mockApiRequest.mockResolvedValueOnce(mockUser)
      await UserService.updateProfile({ firstName: "A", lastName: "B", phone: "+49 123" })
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/users/me",
        expect.objectContaining({
          body: JSON.stringify({ firstName: "A", lastName: "B", phone: "+49 123" }),
        })
      )
    })
  })

  // ── deleteAccount ─────────────────────────────────────────────────────

  describe("deleteAccount", () => {
    it("calls DELETE /api/v1/users/me", async () => {
      mockApiRequest.mockResolvedValueOnce({ userId: "usr_1" })
      await UserService.deleteAccount()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me", { method: "DELETE" })
    })

    it("resolves without a return value", async () => {
      mockApiRequest.mockResolvedValueOnce({ userId: "usr_1" })
      const result = await UserService.deleteAccount()
      expect(result).toBeUndefined()
    })
  })

  // ── getUsers ──────────────────────────────────────────────────────────

  describe("getUsers", () => {
    it("returns all 5 mock users on page 1 with large pageSize", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 100 })
      expect(res.total).toBe(5)
      expect(res.data).toHaveLength(5)
    })

    it("returns correct pagination metadata", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 100 })
      expect(res.page).toBe(1)
      expect(res.pageSize).toBe(100)
      expect(res.totalPages).toBe(1)
    })

    it("filters by search term", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 100, search: "max" })
      expect(
        res.data.every((u) => u.firstName.toLowerCase().includes("max") || u.email.includes("max"))
      ).toBe(true)
    })

    it("filters by role", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 100, role: "SELLER" })
      expect(res.data.every((u) => u.role === "SELLER")).toBe(true)
    })

    it("filters by status", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 100, status: "SUSPENDED" })
      expect(res.data.every((u) => u.status === "SUSPENDED")).toBe(true)
    })

    it("paginates correctly", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 2 })
      expect(res.data).toHaveLength(2)
      expect(res.totalPages).toBe(3)
    })
  })

  // ── getUserById ───────────────────────────────────────────────────────

  describe("getUserById", () => {
    it("returns the correct user by id", async () => {
      const user = await UserService.getUserById("usr_1")
      expect(user.id).toBe("usr_1")
    })

    it("throws if user not found", async () => {
      await expect(UserService.getUserById("nonexistent")).rejects.toThrow("User not found")
    })
  })
})
