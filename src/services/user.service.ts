import { apiRequest } from "@/src/lib/api-client"
import type {
  User,
  PaginatedResponse,
  AdminUserListParams,
  AccountStatus,
  SellerStatus,
  PagedResponse,
  AdminUserListItem,
  SellerProfile,
} from "@/src/types"
import { AdminService } from "@/src/services/admin.service"

export const UserService = {
  // ── Profile ────────────────────────────────────────────────────────
  async getCurrentUser(): Promise<User> {
    return apiRequest<User>("/api/v1/users/me")
  },

  async updateProfile(data: {
    firstName: string
    lastName: string
    phone?: string
  }): Promise<User> {
    return apiRequest<User>("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  async deleteAccount(): Promise<void> {
    await apiRequest<{ userId: string }>("/api/v1/users/me", { method: "DELETE" })
  },

  // ── Admin: User Management ─────────────────────────────────────────
  async getUsers(params: AdminUserListParams): Promise<PaginatedResponse<User>> {
    const res = await AdminService.listUsers({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      role: params.role,
      status: params.status,
    })
    // Backend returns PagedResponse with userId (not id) per API spec.
    type RichItem = AdminUserListItem & {
      userId: string
      firstName?: string
      lastName?: string
      phone?: string
      sellerProfile?: SellerProfile
    }
    const paged = res as PagedResponse<RichItem>
    return {
      data: paged.items.map((item) => ({
        id: item.userId,
        email: item.email,
        firstName: item.firstName ?? "",
        lastName: item.lastName ?? "",
        phone: item.phone,
        role: item.role,
        status: item.status,
        emailVerified: item.emailVerified,
        sellerProfile: item.sellerProfile,
        createdAt: item.createdAt,
      })),
      total: paged.totalItems,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: paged.totalPages,
    }
  },

  async getUserById(id: string): Promise<User> {
    const details = await AdminService.getUser(id)
    return {
      id: details.userId,
      email: details.email,
      firstName: details.firstName ?? "",
      lastName: details.lastName ?? "",
      phone: details.phone,
      role: details.role,
      status: details.status,
      emailVerified: details.emailVerified,
      sellerProfile: details.sellerProfile,
      createdAt: details.createdAt,
    }
  },

  async updateUserStatus(userId: string, status: AccountStatus): Promise<void> {
    if (status === "SUSPENDED") {
      await AdminService.suspendUser(userId)
    } else {
      await AdminService.activateUser(userId)
    }
  },

  // sellerProfileId is the seller profile's own ID (not the user ID)
  async updateSellerStatus(
    sellerProfileId: string,
    sellerStatus: SellerStatus,
    reason: string = ""
  ): Promise<void> {
    if (sellerStatus === "APPROVED") {
      await AdminService.approveSellerProfile(sellerProfileId)
    } else if (sellerStatus === "REJECTED") {
      await AdminService.rejectSellerProfile(sellerProfileId, reason)
    } else if (sellerStatus === "SUSPENDED") {
      await AdminService.suspendSellerProfile(sellerProfileId, reason)
    }
  },
}
