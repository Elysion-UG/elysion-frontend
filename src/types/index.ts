// ── User & Auth Types ──────────────────────────────────────────────
export type UserRole = "BUYER" | "SELLER" | "ADMIN"

// Backend statuses: PENDING | ACTIVE | SUSPENDED | DELETED
export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED"

// Backend seller statuses: PENDING | APPROVED | REJECTED | SUSPENDED
export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role: UserRole
  emailVerified?: boolean
  status: AccountStatus
  sellerProfile?: SellerProfile
  createdAt: string
  updatedAt?: string
}

export interface SellerProfile {
  id: string               // seller profile UUID — required for admin approve/reject/suspend
  userId?: string
  companyName: string
  vatId?: string
  iban?: string
  status: SellerStatus
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
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
  vatId?: string
  iban?: string
}

export type RegisterDTO = RegisterBuyerDTO | RegisterSellerDTO

// ── Login DTO ──────────────────────────────────────────────────────
export interface LoginDTO {
  email: string
  password: string
}

// Backend login/refresh response shape
export interface TokensResponse {
  accessToken: string
  refreshToken: null       // always null in JSON; actual token is HttpOnly cookie
  expiresIn: number        // seconds; backend field name is expiresIn
}

// ── Address Types ──────────────────────────────────────────────────
export type AddressType = "SHIPPING" | "BILLING" | "BOTH"

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

// ── Values Profile Types (buyer matching preferences) ──────────────
// Backend endpoints: GET/PUT /api/v1/users/me/profile
export type ValuesProfileType = "none" | "simple" | "extended"

export interface SimpleValuesProfile {
  type: "simple"
  categories: Record<string, number> // categoryId -> weight 0-100
}

export interface ExtendedValuesProfile {
  type: "extended"
  categories: Record<string, Record<string, number>> // categoryId -> { subId -> weight }
}

export interface NoValuesProfile {
  type: "none"
}

export type ValuesProfile = NoValuesProfile | SimpleValuesProfile | ExtendedValuesProfile

/** Backend response shape for GET/PUT /api/v1/users/me/profile */
export interface BuyerValueProfile {
  id: string
  userId: string
  activeProfileType: ValuesProfileType
  simpleProfile: Record<string, number> | null
  extendedProfile: Record<string, Record<string, number>> | null
  createdAt: string
  updatedAt: string
}

export interface BuyerValueProfileUpsertDTO {
  activeProfileType: ValuesProfileType
  simpleProfile?: Record<string, number> | null
  extendedProfile?: Record<string, Record<string, number>> | null
}

// ── Seller Value Profile (sustainability commitment level) ─────────
// Backend: GET/PUT /api/v1/users/me/seller/value-profile
// Backend values: STANDARD | LEVEL_2 | LEVEL_3
export type SellerValueProfileLevel = "STANDARD" | "LEVEL_2" | "LEVEL_3"

export interface SellerValueProfile {
  sellerProfileId: string
  level: SellerValueProfileLevel
  payload?: string
  score?: number
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

// ── Product Types ───────────────────────────────────────────────────

export type ProductStatus = "DRAFT" | "REVIEW" | "ACTIVE" | "INACTIVE" | "REJECTED"

export type ProductSortOption = "newest" | "price_asc" | "price_desc"

export type VariantOptionType = "SIZE" | "COLOR" | "MATERIAL" | string

export interface ProductImage {
  id?: string
  url: string
  altText?: string
  order: number
}

export interface VariantOption {
  type: VariantOptionType
  value: string
}

export interface ProductVariant {
  id: string
  sku: string
  price: number | null   // absolute price in EUR (null = use product basePrice)
  stock: number
  reserved: number
  available: number
  options: VariantOption[]
}

export interface ProductSeller {
  userId: string
  companyName: string
  firstName: string
  lastName: string
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
}

/** Public storefront product list item — from GET /api/v1/products (Spring Page content array) */
export interface ProductListItem {
  id: string
  title: string
  price: number        // EUR decimal
  currency: string
  sellerId: string
  createdAt: string
}

/** Spring Page envelope for product list */
export interface ProductPage {
  content: ProductListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number       // current page (0-based)
}

/** Public product detail — from GET /api/v1/products/{slug} (wrapped response, data field) */
export interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string
  shortDesc?: string
  basePrice: number    // EUR decimal
  currency: string
  taxRate: number
  status: ProductStatus
  images: ProductImage[]
  variants: ProductVariant[]
  seller: ProductSeller
  category: ProductCategory
  views: number
  salesCount: number
}

/** Internal product detail — from GET /api/v1/products/{id} (raw response, no wrapper) */
export interface ProductInternalDetail {
  id: string
  title: string
  description: string
  price: number
  currency: string
  sellerId: string
  createdAt: string
  updatedAt: string
}

/** Response from create/update/status product endpoints */
export interface ProductCommandResponse {
  id: string
  slug: string
  status: ProductStatus
}

export interface ProductVariantInput {
  sku: string
  stock: number
  price?: number | null
  options: VariantOption[]
}

export interface ProductCreateDTO {
  categoryId: string
  name: string
  description: string
  shortDesc?: string
  basePrice: number
  currency: string
  taxRate: number
  weight?: number
  variants?: ProductVariantInput[]
}

export interface ProductUpdateDTO {
  categoryId?: string
  name?: string
  description?: string
  shortDesc?: string
  basePrice?: number
  currency?: string
  taxRate?: number
}

export interface ProductStatusUpdateDTO {
  status: ProductStatus
}

export interface ProductImageCreateDTO {
  url: string
  altText?: string
  order: number
}

export interface ProductImageReorderItem {
  imageId: string
  order: number
}

export interface ProductImageReorderDTO {
  images: ProductImageReorderItem[]
}

export interface ProductListParams {
  search?: string
  categoryId?: string
  sellerId?: string
  minPrice?: number
  maxPrice?: number
  sort?: ProductSortOption
  page?: number
  size?: number
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

// ── Certificate Types ───────────────────────────────────────────────

export type CertificateStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED"

export type CertificateType = "ORGANIC" | "FAIR_TRADE" | "RECYCLED" | "VEGAN" | string

export interface Certificate {
  id: string
  sellerId: string
  certificateType: CertificateType
  status: CertificateStatus
  title: string
  issuerName?: string | null
  certificateNumber?: string | null
  documentUrl?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  notes?: string | null
  verifiedByAdminId?: string | null
  verifiedAt?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface CertificateCreateDTO {
  certificateType: CertificateType
  title: string
  issuerName?: string
  certificateNumber?: string
  documentUrl?: string
  issueDate?: string
  expiryDate?: string
  notes?: string
}

export interface CertificateUpdateDTO {
  title?: string
  issuerName?: string
  certificateNumber?: string
  documentUrl?: string
  issueDate?: string
  expiryDate?: string
  notes?: string
}

/** Public-safe certificate view — from GET /api/v1/products/{productId}/certificates */
export interface PublicCertificate {
  certificateId: string
  certificateType: CertificateType
  title: string
  issuerName?: string
  certificateNumber?: string
  issueDate?: string
  expiryDate?: string
  status: "VERIFIED"
}

/** Response from admin verify/reject endpoints */
export interface CertificateAdminActionResponse {
  id: string
  status: CertificateStatus
  verifiedByAdminId?: string | null
  verifiedAt?: string | null
  rejectionReason?: string | null
}

export interface CertificateLinkResponse {
  certificateId: string
  productId: string
  createdAt: string
}

// ============================================================
// Cart
// ============================================================
export interface CartItemOption {
  name: string
  value: string
}

export interface CartItem {
  id: string
  cartId: string
  variantId: string
  productId: string
  productName: string
  productSlug: string
  variantOptions: CartItemOption[]
  imageUrl?: string
  quantity: number
  unitPriceCents: number
  totalPriceCents: number
  currency: string
}

export interface Cart {
  id: string
  sessionId?: string
  userId?: string
  items: CartItem[]
  subtotalCents: number
  totalCents: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface AddToCartDTO {
  productId: string
  variantId?: string
  quantity: number
}

export interface UpdateCartItemDTO {
  quantity: number
}

// ============================================================
// Checkout
// ============================================================
export interface CheckoutAddressDTO {
  firstName: string
  lastName: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
}

export interface CheckoutDTO {
  shippingAddressId?: string
  shippingAddress?: CheckoutAddressDTO
  billingSameAsShipping?: boolean
  billingAddress?: CheckoutAddressDTO
  paymentMethod: string
  guestEmail?: string
}

export interface CheckoutPreviewItem {
  productName: string
  variantOptions?: CartItemOption[]
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
  imageUrl?: string
}

/** Backend: POST /api/v1/checkout response */
export interface CheckoutStartResponse {
  readyToProceed: boolean
  cartId: string
  ownershipType: string
  totalQuantity: number
  subtotal: number
  shippingCost: number
  total: number
  currency: string
  items: CheckoutPreviewItem[]
  shippingAddress: CheckoutAddressDTO
  billingAddress?: CheckoutAddressDTO
}

/** @deprecated Use CheckoutStartResponse */
export type CheckoutPreview = CheckoutStartResponse

export interface CheckoutCompleteResponse {
  completionId: string
  orderId: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  completedAt: string
  checkout: CheckoutStartResponse
}

// ============================================================
// Orders (Buyer)
// ============================================================
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"

export type PaymentStatusType = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED"

export type OrderGroupStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

export interface OrderShipment {
  trackingNumber?: string
  carrier?: string
  shippedAt?: string
  estimatedDelivery?: string
}

export interface OrderGroupSummary {
  id: string
  sellerId: string
  sellerName: string
  status: OrderGroupStatus
  subtotalCents: number
  currency: string
  itemCount: number
  shipment?: OrderShipment
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatusType
  total: number
  subtotal: number
  shippingCost: number
  currency: string
  itemCount?: number
  createdAt: string
  updatedAt: string
}

export interface OrderItemSnapshot {
  productId: string
  variantId: string
  productName: string
  variantOptions: CartItemOption[]
  imageUrl?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
}

export interface OrderDetail {
  id: string
  orderNumber: string
  userId?: string
  guestEmail?: string
  status: OrderStatus
  paymentStatus: PaymentStatusType
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  currency: string
  shippingAddress: CheckoutAddressDTO
  billingAddress?: CheckoutAddressDTO
  groups: OrderGroupDetail[]
  paymentId?: string
  createdAt: string
  updatedAt: string
}

// ============================================================
// Seller Orders (OrderGroups)
// ============================================================
export interface OrderGroupItem {
  productId: string
  variantId: string
  productName: string
  variantOptions: CartItemOption[]
  imageUrl?: string
  quantity: number
  unitPriceCents: number
  totalPriceCents: number
  currency: string
}

export interface OrderGroupDetail {
  id: string
  orderId: string
  orderNumber: string
  sellerId: string
  status: OrderGroupStatus
  subtotalCents: number
  currency: string
  items: OrderGroupItem[]
  buyerShippingAddress?: CheckoutAddressDTO
  shipment?: OrderShipment
  createdAt: string
  updatedAt: string
}

export interface OrderGroupsPage {
  content: OrderGroupDetail[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ShipOrderDTO {
  trackingNumber: string
  carrier: string
}

// ============================================================
// Payments
// ============================================================
export interface PaymentIntent {
  clientSecret: string
  paymentId: string
  amountCents: number
  currency: string
}

export interface PaymentStatusResponse {
  id: string
  status: PaymentStatusType
  amountCents: number
  currency: string
  createdAt: string
}

export interface CreatePaymentIntentDTO {
  orderId: string
}

// ============================================================
// Files
// ============================================================
export type FileCategory =
  | "PRODUCT_IMAGE"
  | "CERTIFICATE_DOCUMENT"
  | "SHOP_LOGO"
  | "PROFILE_IMAGE"

export type FileLinkTarget =
  | "PRODUCT"
  | "CERTIFICATE"
  | "SELLER_PROFILE"
  | "USER_PROFILE"

export interface FileUploadResponse {
  fileId: string
  filename: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
  url?: string
}

export interface FileMetadata {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  category: FileCategory
  uploadedAt: string
  url?: string
}

export interface FileLinkDTO {
  target: FileLinkTarget
  targetId: string
}

// ============================================================
// Recommendations
// ============================================================
export interface MatchBreakdown {
  category: string
  score: number
  weight: number
}

export interface Recommendation {
  productId: string
  slug: string
  name: string
  basePrice: number
  currency: string
  imageUrl?: string
  sellerName?: string
  matchScore: number
  matchBreakdown: MatchBreakdown[]
}

// ============================================================
// Seller Settlements
// ============================================================
export type SettlementStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED"

export interface Settlement {
  id: string
  sellerId: string
  periodStart: string
  periodEnd: string
  grossAmountCents: number
  platformFeeCents: number
  netAmountCents: number
  currency: string
  status: SettlementStatus
  paidAt?: string
  createdAt: string
}

export interface SettlementsPage {
  content: Settlement[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
