// ── User & Auth Types ──────────────────────────────────────────────
export type UserRole = "BUYER" | "SELLER" | "ADMIN"
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "PENDING" | "DELETED"
export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  emailVerified: boolean
  status: AccountStatus
  sellerProfile?: SellerProfile
  createdAt: string
}

export interface SellerProfile {
  id: string
  companyName: string
  status: SellerStatus
  vatId?: string
  iban?: string
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

/** Returned by /auth/{portal}/login and /auth/refresh */
export interface TokensResponse {
  accessToken: string
  /** Present on login, null on refresh */
  user: User | null
  expiresIn: number
  /** True when a guest cart was merged into the user cart during login */
  guestCartMerged?: boolean
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
