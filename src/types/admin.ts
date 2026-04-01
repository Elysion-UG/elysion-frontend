import type { UserRole, AccountStatus, SellerProfile, SellerStatus } from "./user"
import type { OrderStatus } from "./order"
import type { ProductStatus } from "./product"

// ── Admin Types ────────────────────────────────────────────────────

/** Frontend-shaped paginated response (used by components) */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Backend-shaped paginated response envelope */
export interface PagedResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface AdminUserListParams {
  page: number
  pageSize: number
  search?: string
  role?: UserRole
  status?: AccountStatus
}

export interface AdminUserListItem {
  id: string
  email: string
  role: UserRole
  status: AccountStatus
  emailVerified: boolean
  createdAt: string
  updatedAt?: string
}

export interface AdminUserDetails extends AdminUserListItem {
  firstName?: string
  lastName?: string
  phone?: string
  sellerProfile?: SellerProfile & {
    approvedBy?: string
    rejectedBy?: string
    createdAt: string
    updatedAt: string
  }
}

export interface AdminOrderListItem {
  id: string
  orderNumber: string
  guestEmail?: string | null
  userId?: string | null
  status: OrderStatus
  paymentStatus: string
  total: number
  createdAt: string
}

export interface AdminProductListItem {
  id: string
  title: string
  sellerId: string
  sellerName?: string | null
  price: number
  status: ProductStatus
  createdAt: string
}

export interface AdminSellerListItem {
  id: string
  userId: string
  companyName: string
  user: { email: string }
  vatId?: string | null
  status: SellerStatus
  createdAt: string
}

export interface AdminPaymentItem {
  id: string
  orderId: string
  orderNumber?: string | null
  status: string
  amountCents: number
  createdAt: string
}

export interface AdminRefundItem {
  id: string
  paymentId: string
  amountCents: number
  reason?: string | null
  status: string
  createdAt: string
}

export interface AdminPayoutItem {
  id: string
  sellerId: string
  sellerName?: string | null
  amountCents: number
  status: string
  createdAt: string
}
