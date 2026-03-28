/**
 * UserService — abstract service layer for user profile, values profile, and admin operations.
 */
import type {
  User,
  ValuesProfile,
  PaginatedResponse,
  AdminUserListParams,
  AccountStatus,
  SellerStatus,
} from "@/src/types"

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

export const UserService = {
  // ── Profile ────────────────────────────────────────────────────────
  async getCurrentUser(): Promise<User> {
    await delay()
    return {
      id: "usr_1",
      email: "max.mustermann@email.de",
      firstName: "Max",
      lastName: "Mustermann",
      phone: "+49 123 456789",
      role: "BUYER",
      status: "ACTIVE",
      createdAt: "2024-01-15T10:00:00Z",
    }
  },

  async updateProfile(data: {
    firstName: string
    lastName: string
    phone?: string
  }): Promise<User> {
    await delay()
    return {
      id: "usr_1",
      email: "max.mustermann@email.de",
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: "BUYER",
      status: "ACTIVE",
      createdAt: "2024-01-15T10:00:00Z",
    }
  },

  async deleteAccount(): Promise<void> {
    await delay(800)
  },

  // ── Values Profile ─────────────────────────────────────────────────
  async getValuesProfile(): Promise<ValuesProfile> {
    await delay()
    return { type: "none" }
  },

  async saveValuesProfile(profile: ValuesProfile): Promise<ValuesProfile> {
    await delay()
    return profile
  },

  // ── Admin: User Management ─────────────────────────────────────────
  async getUsers(params: AdminUserListParams): Promise<PaginatedResponse<User>> {
    await delay()
    const mockUsers: User[] = [
      {
        id: "usr_1",
        email: "max.mustermann@email.de",
        firstName: "Max",
        lastName: "Mustermann",
        role: "BUYER",
        status: "ACTIVE",
        createdAt: "2024-01-15T10:00:00Z",
      },
      {
        id: "usr_2",
        email: "anna.schmidt@email.de",
        firstName: "Anna",
        lastName: "Schmidt",
        role: "SELLER",
        status: "ACTIVE",
        sellerProfile: {
          id: "sp_1",
          companyName: "GreenGoods GmbH",
          vatId: "DE123456789",
          iban: "DE89370400440532013000",
          status: "APPROVED",
        },
        createdAt: "2024-02-20T14:30:00Z",
      },
      {
        id: "usr_3",
        email: "peter.meier@email.de",
        firstName: "Peter",
        lastName: "Meier",
        role: "SELLER",
        status: "ACTIVE",
        sellerProfile: {
          id: "sp_2",
          companyName: "EcoStyle",
          vatId: "DE987654321",
          iban: "DE02120300000000202051",
          status: "PENDING",
        },
        createdAt: "2024-03-10T09:15:00Z",
      },
      {
        id: "usr_4",
        email: "lisa.weber@email.de",
        firstName: "Lisa",
        lastName: "Weber",
        role: "BUYER",
        status: "SUSPENDED",
        createdAt: "2024-01-22T11:45:00Z",
      },
      {
        id: "usr_5",
        email: "admin@elysion.de",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: "2023-12-01T08:00:00Z",
      },
    ]

    let filtered = [...mockUsers]
    if (params.search) {
      const q = params.search.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    }
    if (params.role) filtered = filtered.filter((u) => u.role === params.role)
    if (params.status) filtered = filtered.filter((u) => u.status === params.status)

    const start = (params.page - 1) * params.pageSize
    const page = filtered.slice(start, start + params.pageSize)

    return {
      data: page,
      total: filtered.length,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(filtered.length / params.pageSize),
    }
  },

  async getUserById(id: string): Promise<User> {
    await delay()
    const allUsers = (await UserService.getUsers({ page: 1, pageSize: 100 })).data
    const user = allUsers.find((u) => u.id === id)
    if (!user) throw new Error("User not found")
    return user
  },

  async updateUserStatus(userId: string, status: AccountStatus): Promise<void> {
    await delay()
    void userId
    void status
  },

  async updateSellerStatus(userId: string, sellerStatus: SellerStatus): Promise<void> {
    await delay()
    void userId
    void sellerStatus
  },
}
