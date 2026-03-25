/**
 * UserService — real API calls for user profile and admin user management.
 *
 * Endpoints used:
 *   GET  /api/v1/users/me                          — current user data
 *   PATCH /api/v1/users/me                         — update firstName/lastName/phone
 *   DELETE /api/v1/users/me                        — soft-delete account
 *   GET  /api/v1/admin/users?page&size             — paginated user list (ADMIN)
 *   GET  /api/v1/admin/users/{id}                  — user details incl. seller profile (ADMIN)
 *   PATCH /api/v1/admin/users/{id}/suspend         — suspend user (ADMIN)
 *   PATCH /api/v1/admin/users/{id}/activate        — activate user (ADMIN)
 *   POST /api/v1/admin/seller-profiles/{id}/approve — approve seller profile (ADMIN)
 *   POST /api/v1/admin/seller-profiles/{id}/reject  — reject seller profile (ADMIN)
 *
 */
import { apiRequest } from "@/src/lib/api-client"
import type {
  User,
  PaginatedResponse,
  AdminUserListParams,
  SellerProfile,
} from "@/src/types"

// ── Shapes returned by the backend ────────────────────────────────────────────

interface BackendUserMe {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role: string
  emailVerified: boolean
  status: string
  createdAt?: string
}

interface BackendSellerProfileDetails {
  id: string
  userId: string
  companyName: string
  vatId?: string
  iban?: string
  status: string
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
}

interface BackendAdminUserDetails extends BackendUserMe {
  updatedAt?: string
  sellerProfile?: BackendSellerProfileDetails
}

interface BackendAdminUserListItem {
  id: string
  email: string
  role: string
  status: string
  emailVerified: boolean
  createdAt: string
  updatedAt?: string
}

interface BackendPagedResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapUserMe(b: BackendUserMe): User {
  return {
    id: b.id,
    email: b.email,
    firstName: b.firstName ?? undefined,
    lastName: b.lastName ?? undefined,
    phone: b.phone ?? undefined,
    role: b.role as User["role"],
    emailVerified: b.emailVerified,
    status: b.status as User["status"],
    createdAt: b.createdAt ?? new Date().toISOString(),
  }
}

function mapAdminUser(b: BackendAdminUserDetails): User {
  const sellerProfile: SellerProfile | undefined = b.sellerProfile
    ? {
        id: b.sellerProfile.id,
        userId: b.sellerProfile.userId,
        companyName: b.sellerProfile.companyName,
        vatId: b.sellerProfile.vatId,
        iban: b.sellerProfile.iban,
        status: b.sellerProfile.status as SellerProfile["status"],
        approvedAt: b.sellerProfile.approvedAt,
        rejectedAt: b.sellerProfile.rejectedAt,
        rejectionReason: b.sellerProfile.rejectionReason,
      }
    : undefined

  return {
    id: b.id,
    email: b.email,
    firstName: b.firstName ?? undefined,
    lastName: b.lastName ?? undefined,
    phone: b.phone ?? undefined,
    role: b.role as User["role"],
    emailVerified: b.emailVerified,
    status: b.status as User["status"],
    sellerProfile,
    createdAt: b.createdAt ?? new Date().toISOString(),
    updatedAt: b.updatedAt,
  }
}

function mapAdminListItem(b: BackendAdminUserListItem): User {
  return {
    id: b.id,
    email: b.email,
    role: b.role as User["role"],
    status: b.status as User["status"],
    emailVerified: b.emailVerified,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    // firstName/lastName not included in list response
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const UserService = {
  // ── Profile ────────────────────────────────────────────────────────────────

  async getCurrentUser(): Promise<User> {
    const data = await apiRequest<BackendUserMe>("/api/v1/users/me")
    return mapUserMe(data)
  },

  async updateProfile(data: {
    firstName?: string
    lastName?: string
    phone?: string
  }): Promise<User> {
    const result = await apiRequest<BackendUserMe>("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    return mapUserMe(result)
  },

  async deleteAccount(): Promise<void> {
    await apiRequest("/api/v1/users/me", { method: "DELETE" })
  },

  // ── Admin: User Management ─────────────────────────────────────────────────

  async getUsers(params: AdminUserListParams): Promise<PaginatedResponse<User>> {
    // Backend uses 0-indexed pages; frontend uses 1-indexed.
    // Fetch a large page to support client-side filtering (backend has no search/filter support yet).
    const backendPage = 0
    const backendSize = 200

    const data = await apiRequest<BackendPagedResponse<BackendAdminUserListItem>>(
      `/api/v1/admin/users?page=${backendPage}&size=${backendSize}`
    )

    let items = data.items.map(mapAdminListItem)

    // Client-side filtering
    if (params.search) {
      const q = params.search.toLowerCase()
      items = items.filter((u) => u.email.toLowerCase().includes(q))
    }
    if (params.role) {
      items = items.filter((u) => u.role === params.role)
    }
    if (params.status) {
      items = items.filter((u) => u.status === params.status)
    }

    // Client-side pagination
    const total = items.length
    const start = (params.page - 1) * params.pageSize
    const page = items.slice(start, start + params.pageSize)

    return {
      data: page,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    }
  },

  async getUserById(id: string): Promise<User> {
    const data = await apiRequest<BackendAdminUserDetails>(`/api/v1/admin/users/${id}`)
    return mapAdminUser(data)
  },

  async updateUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED"): Promise<void> {
    const action = status === "SUSPENDED" ? "suspend" : "activate"
    await apiRequest(`/api/v1/admin/users/${userId}/${action}`, {
      method: "PATCH",
    })
  },

  /**
   * @param sellerProfileId  The seller profile's own UUID (not the user ID).
   * @param action           "APPROVED" → approve, "REJECTED" → reject with default reason.
   */
  async updateSellerStatus(
    sellerProfileId: string,
    action: "APPROVED" | "REJECTED"
  ): Promise<void> {
    if (action === "APPROVED") {
      await apiRequest(`/api/v1/admin/seller-profiles/${sellerProfileId}/approve`, {
        method: "POST",
        body: "{}",
      })
    } else {
      await apiRequest(`/api/v1/admin/seller-profiles/${sellerProfileId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Antrag abgelehnt." }),
      })
    }
  },
}
