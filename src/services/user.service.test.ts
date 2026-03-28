import { describe, it, expect } from "vitest"
import { UserService } from "./user.service"

// UserService uses hardcoded mock data with delay() — no mocking needed.
// Tests run against the real in-memory logic.

describe("UserService", () => {
  // ── getCurrentUser ────────────────────────────────────────────────────

  describe("getCurrentUser", () => {
    it("returns a user with the expected shape", async () => {
      const user = await UserService.getCurrentUser()
      expect(user).toMatchObject({
        id: "usr_1",
        email: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        role: "BUYER",
        status: "ACTIVE",
        createdAt: expect.any(String),
      })
    })
  })

  // ── updateProfile ─────────────────────────────────────────────────────

  describe("updateProfile", () => {
    it("reflects the updated firstName and lastName in the returned user", async () => {
      const updated = await UserService.updateProfile({
        firstName: "Hans",
        lastName: "Gruber",
        phone: "+49 999 000111",
      })
      expect(updated.firstName).toBe("Hans")
      expect(updated.lastName).toBe("Gruber")
      expect(updated.phone).toBe("+49 999 000111")
    })

    it("allows phone to be undefined", async () => {
      const updated = await UserService.updateProfile({
        firstName: "Hans",
        lastName: "Gruber",
      })
      expect(updated.phone).toBeUndefined()
    })

    it("preserves fixed fields regardless of input", async () => {
      const updated = await UserService.updateProfile({
        firstName: "X",
        lastName: "Y",
      })
      expect(updated.id).toBe("usr_1")
      expect(updated.role).toBe("BUYER")
      expect(updated.status).toBe("ACTIVE")
    })
  })

  // ── deleteAccount ─────────────────────────────────────────────────────

  describe("deleteAccount", () => {
    it("resolves without a return value", async () => {
      const result = await UserService.deleteAccount()
      expect(result).toBeUndefined()
    })
  })

  // ── getValuesProfile ──────────────────────────────────────────────────

  describe("getValuesProfile", () => {
    it("returns a values profile with type 'none' by default", async () => {
      const profile = await UserService.getValuesProfile()
      expect(profile).toEqual({ type: "none" })
    })
  })

  // ── saveValuesProfile ─────────────────────────────────────────────────

  describe("saveValuesProfile", () => {
    it("echoes back the exact profile passed in", async () => {
      const input = { type: "eco", priorities: ["organic", "fair-trade"] } as any
      const result = await UserService.saveValuesProfile(input)
      expect(result).toEqual(input)
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

    it("paginates correctly — page 1 of 2 with pageSize 3", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 3 })
      expect(res.data).toHaveLength(3)
      expect(res.total).toBe(5)
      expect(res.totalPages).toBe(2)
    })

    it("paginates correctly — page 2 of 2 with pageSize 3", async () => {
      const res = await UserService.getUsers({ page: 2, pageSize: 3 })
      expect(res.data).toHaveLength(2)
    })

    it("returns empty data array when page is out of range", async () => {
      const res = await UserService.getUsers({ page: 99, pageSize: 10 })
      expect(res.data).toHaveLength(0)
      expect(res.total).toBe(5)
    })

    // ── search ──────────────────────────────────────────────────────────

    it("filters by firstName match (case-insensitive)", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 10, search: "max" })
      expect(res.total).toBe(1)
      expect(res.data[0].firstName).toBe("Max")
    })

    it("filters by lastName match (case-insensitive)", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 10, search: "SCHMIDT" })
      expect(res.total).toBe(1)
      expect(res.data[0].lastName).toBe("Schmidt")
    })

    it("filters by email match (case-insensitive)", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 10, search: "admin@elysion" })
      expect(res.total).toBe(1)
      expect(res.data[0].role).toBe("ADMIN")
    })

    it("returns 0 results for a search that matches nothing", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 10, search: "zzznomatch" })
      expect(res.total).toBe(0)
      expect(res.data).toHaveLength(0)
    })

    // ── role filter ──────────────────────────────────────────────────────

    it("filters by BUYER role", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 10, role: "BUYER" })
      expect(res.total).toBe(2)
      res.data.forEach((u) => expect(u.role).toBe("BUYER"))
    })

    it("filters by SELLER role", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 10, role: "SELLER" })
      expect(res.total).toBe(2)
      res.data.forEach((u) => expect(u.role).toBe("SELLER"))
    })

    it("filters by ADMIN role", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 10, role: "ADMIN" })
      expect(res.total).toBe(1)
      expect(res.data[0].email).toBe("admin@elysion.de")
    })

    // ── status filter ────────────────────────────────────────────────────

    it("filters by ACTIVE status", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 10, status: "ACTIVE" })
      expect(res.total).toBe(4)
      res.data.forEach((u) => expect(u.status).toBe("ACTIVE"))
    })

    it("filters by SUSPENDED status", async () => {
      const res = await UserService.getUsers({ page: 1, pageSize: 10, status: "SUSPENDED" })
      expect(res.total).toBe(1)
      expect(res.data[0].id).toBe("usr_4")
    })

    // ── combined filters ─────────────────────────────────────────────────

    it("combines role and status filters", async () => {
      // Both sellers (usr_2 and usr_3) have user status "ACTIVE" — only usr_4 is SUSPENDED
      const res = await UserService.getUsers({
        page: 1,
        pageSize: 10,
        role: "SELLER",
        status: "ACTIVE",
      })
      expect(res.total).toBe(2)
      res.data.forEach((u) => {
        expect(u.role).toBe("SELLER")
        expect(u.status).toBe("ACTIVE")
      })
    })

    it("combines search and role filters", async () => {
      const res = await UserService.getUsers({
        page: 1,
        pageSize: 10,
        search: "anna",
        role: "SELLER",
      })
      expect(res.total).toBe(1)
      expect(res.data[0].firstName).toBe("Anna")
    })
  })

  // ── getUserById ───────────────────────────────────────────────────────

  describe("getUserById", () => {
    it("returns the correct user for a known id", async () => {
      const user = await UserService.getUserById("usr_1")
      expect(user.id).toBe("usr_1")
      expect(user.email).toBe("max.mustermann@email.de")
    })

    it("returns a seller user with sellerProfile", async () => {
      const user = await UserService.getUserById("usr_2")
      expect(user.role).toBe("SELLER")
      expect(user.sellerProfile).toBeDefined()
      expect(user.sellerProfile?.companyName).toBe("GreenGoods GmbH")
    })

    it("throws an error for an unknown id", async () => {
      await expect(UserService.getUserById("nonexistent_id")).rejects.toThrow(
        "User not found"
      )
    })
  })

  // ── updateUserStatus ──────────────────────────────────────────────────

  describe("updateUserStatus", () => {
    it("resolves without a return value", async () => {
      const result = await UserService.updateUserStatus("usr_1", "SUSPENDED")
      expect(result).toBeUndefined()
    })
  })

  // ── updateSellerStatus ────────────────────────────────────────────────

  describe("updateSellerStatus", () => {
    it("resolves without a return value", async () => {
      const result = await UserService.updateSellerStatus("usr_2", "APPROVED")
      expect(result).toBeUndefined()
    })
  })
})
