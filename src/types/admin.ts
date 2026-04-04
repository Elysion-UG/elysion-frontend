import type { UserRole, AccountStatus, SellerProfile, SellerStatus } from "./user"
import type { OrderStatus, OrderGroupStatus } from "./order"
import type { ProductStatus } from "./product"

// ── Admin Dashboard ──────────────────────────────────────────────────

export interface AdminDashboardUserMetrics {
  total: number
  buyers: number
  sellers: number
  admins: number
}

export interface AdminDashboardProductMetrics {
  total: number
  active: number
  review: number
}

export interface AdminDashboardOrderMetrics {
  total: number
  pending: number
  processing: number
  shipped: number
}

export interface AdminDashboardCertificateMetrics {
  total: number
  pending: number
  verified: number
  rejected: number
}

export interface AdminDashboardData {
  users: AdminDashboardUserMetrics
  products: AdminDashboardProductMetrics
  orders: AdminDashboardOrderMetrics
  certificates: AdminDashboardCertificateMetrics
}

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
  totalItems: number
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
  userId: string
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
  currency?: string
  createdAt: string
}

export interface AdminOrderGroup {
  id: string
  sellerId: string
  status: OrderGroupStatus
  subtotal: number
  shipping: number
  total: number
  trackingNumber?: string | null
  carrier?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  createdAt: string
}

export interface AdminOrderDetail extends AdminOrderListItem {
  subtotal: number
  shipping: number
  tax: number
  shippingAddress?: Record<string, unknown>
  billingAddress?: Record<string, unknown>
  orderGroups: AdminOrderGroup[]
}

export interface AdminProductListItem {
  id: string
  name: string
  slug: string
  sellerId: string
  status: ProductStatus
  createdAt: string
}

export interface AdminProductDetail extends AdminProductListItem {
  verifiedCertificateCount: number
  updatedAt: string
}

export interface AdminSellerListItem {
  id: string
  userId: string
  userEmail: string
  companyName: string
  vatId?: string | null
  status: SellerStatus
  createdAt: string
}

export interface AdminSellerDetail {
  id: string
  userId: string
  userEmail: string
  companyName: string
  status: SellerStatus
  createdAt: string
  updatedAt?: string
}

export interface AdminPaymentItem {
  paymentId: string
  orderId: string
  orderNumber?: string | null
  userId?: string | null
  provider?: string | null
  amount: number
  currency?: string
  status: string
  refundedAmount?: number
  createdAt: string
  succeededAt?: string | null
  failedAt?: string | null
}

export interface AdminRefundItem {
  refundId: string
  paymentId: string
  orderId?: string | null
  orderGroupId?: string | null
  amount: number
  currency?: string
  status: string
  createdAt: string
  succeededAt?: string | null
  failedAt?: string | null
}

export interface AdminPayoutItem {
  payoutId: string
  sellerId: string
  sellerName?: string | null
  amount: number
  currency?: string
  provider?: string | null
  status: string
  createdAt: string
  succeededAt?: string | null
  failedAt?: string | null
}
