// ── User & Auth Types ──────────────────────────────────────────────
export type UserRole = "BUYER" | "SELLER" | "ADMIN"
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION"
export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  status: AccountStatus
  sellerProfile?: SellerProfile
  createdAt: string
}

export interface SellerProfile {
  id: string
  companyName: string
  vatId?: string
  iban?: string
  status: SellerStatus
  rejectionReason?: string
  approvedAt?: string
  rejectedAt?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ── Registration DTO ───────────────────────────────────────────────
export interface RegisterBuyerDTO {
  email: string
  password: string
  firstName: string
  lastName: string
  role: "BUYER"
}

export interface RegisterSellerDTO {
  email: string
  password: string
  firstName: string
  lastName: string
  role: "SELLER"
  companyName: string
  vatId: string
  iban: string
}

export type RegisterDTO = RegisterBuyerDTO | RegisterSellerDTO

// ── Login DTO ──────────────────────────────────────────────────────
export interface LoginDTO {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

// ── Address Types ──────────────────────────────────────────────────
export type AddressType = "SHIPPING" | "BILLING"

export interface Address {
  id: string
  type: AddressType
  firstName: string
  lastName: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
  isDefault: boolean
}

export interface AddressDTO {
  type: AddressType
  firstName: string
  lastName: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
  isDefault: boolean
}

// ── Values Profile Types ───────────────────────────────────────────
export type ValuesProfileType = "none" | "simple" | "extended"

export interface SimpleValuesProfile {
  type: "simple"
  categories: Record<string, number> // categoryId -> weight 0-100
}

export interface ExtendedValuesProfile {
  type: "extended"
  categories: Record<string, Record<string, number>> // categoryId -> { subId -> weight 0-100 }
}

export interface NoValuesProfile {
  type: "none"
}

export type ValuesProfile = NoValuesProfile | SimpleValuesProfile | ExtendedValuesProfile

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

// ── Category Types ──────────────────────────────────────────────────

export type CategoryStatus = "ACTIVE" | "INACTIVE"

/** Flat category item — from GET /api/v1/categories */
export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  level: 1 | 2 | 3
  description?: string
  order: number
  status?: CategoryStatus
}

/** Tree node — from GET /api/v1/categories/tree */
export interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  level: 1 | 2 | 3
  order: number
  children: CategoryTreeNode[]
}

export interface CategoryCreateDTO {
  name: string
  slug?: string
  parentId?: string | null
  description?: string
  order?: number
}

export interface CategoryUpdateDTO {
  name?: string
  description?: string
  order?: number
}
