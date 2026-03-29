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

/** Returned by /auth/login and /auth/refresh */
export interface TokensResponse {
  accessToken: string
  user: User
  expiresIn: number
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

// ── Seller Value Profile ────────────────────────────────────────────
export type SellerValueProfileLevel = "STANDARD" | "LEVEL_2" | "LEVEL_3"

export interface SellerValueProfile {
  id: string
  sellerId: string
  level: SellerValueProfileLevel
  payload?: string
  score?: number
  updatedAt: string
}

// ── Buyer Value Profile ──────────────────────────────────────────────
export interface BuyerValueProfile {
  id: string
  userId: string
  activeProfileType: ValuesProfileType
  simpleProfile: Record<string, number> | null
  extendedProfile: Record<string, Record<string, number>> | null
  updatedAt: string
}

export interface BuyerValueProfileUpsertDTO {
  activeProfileType: ValuesProfileType
  simpleProfile?: Record<string, number> | null
  extendedProfile?: Record<string, Record<string, number>> | null
}

// ── Certificate Types ────────────────────────────────────────────────
export type CertificateStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED"
export type CertificateType = "ORGANIC" | "FAIR_TRADE" | "RECYCLED" | "VEGAN"

export interface Certificate {
  id: string
  sellerId: string
  /** Display title shown in UI */
  title: string
  name?: string
  certificateType: CertificateType
  issuerName: string
  issuingBody?: string
  certificateNumber?: string
  validFrom: string
  validUntil?: string
  expiryDate?: string
  status: CertificateStatus
  rejectionReason?: string
  documentUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CertificateCreateDTO {
  title?: string
  name?: string
  certificateType?: CertificateType
  issuingBody?: string
  issuerName?: string
  certificateNumber?: string
  validFrom?: string
  issueDate?: string
  validUntil?: string
  expiryDate?: string
  documentUrl?: string
  notes?: string
}

export interface CertificateUpdateDTO {
  title?: string
  name?: string
  issuingBody?: string
  certificateNumber?: string
  validFrom?: string
  validUntil?: string
  documentUrl?: string
}

export interface CertificateAdminActionResponse {
  id: string
  status: CertificateStatus
  updatedAt: string
}

export interface CertificateLinkResponse {
  certificateId: string
  productId: string
}

export interface PublicCertificate {
  id: string
  title?: string
  name?: string
  issuingBody?: string
  issuerName?: string
  validFrom?: string
  validUntil?: string
  expiryDate?: string
  status: CertificateStatus
  certificateType?: CertificateType
}

// ── Cart Types ───────────────────────────────────────────────────────
export interface CartItem {
  id: string
  productId: string
  productName?: string
  productSlug?: string
  variantId?: string
  variantOptions?: Array<{ name: string; value: string }>
  name?: string
  imageUrl?: string
  quantity: number
  unitPrice?: number
  unitPriceCents?: number
  totalPrice?: number
  totalPriceCents?: number
  /** Backend field: unit price in euro (decimal) */
  priceSnapshot?: number
  /** Backend field: line total in euro (decimal) */
  lineTotal?: number
}

export interface Cart {
  id?: string
  items: CartItem[]
  totalAmount?: number
  subtotalCents?: number
  itemCount?: number
}

export interface AddToCartDTO {
  productId: string
  variantId?: string
  quantity: number
}

export interface UpdateCartItemDTO {
  quantity: number
}

// ── Checkout Types ───────────────────────────────────────────────────
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
  shippingAddressId: string
  billingAddressId?: string
  billingSameAsShipping?: boolean
  billingAddress?: CheckoutAddressDTO
  paymentMethod: "STRIPE" | "INVOICE" | "MOCK"
}

export interface CheckoutStartResponse {
  checkoutId?: string
  cartId?: string
  ownershipType?: string
  items?: Array<{
    quantity: number
    productName: string
    unitPrice?: number
    totalPrice: number
    variantOptions?: Array<{ name: string; value: string }>
  }>
  shippingAddress?: Address
  subtotal?: number
  shippingCost?: number
  total?: number
  totalQuantity?: number
  readyToProceed?: boolean
  paymentIntentClientSecret?: string
}

export interface CheckoutCompleteResponse {
  completionId?: string
  orderId?: string
  orderNumber?: string
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  completedAt?: string
  checkout?: CheckoutStartResponse
}

// ── Order Types ──────────────────────────────────────────────────────
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"

export interface Order {
  id: string
  orderNumber?: string
  buyerId?: string
  status: OrderStatus
  totalAmount?: number
  total?: number
  itemCount?: number | null
  createdAt: string
  updatedAt?: string
}

export interface OrderItem {
  id: string
  productId: string
  variantId?: string
  name?: string
  productName?: string
  imageUrl?: string
  variantOptions?: Array<{ name: string; value: string }>
  quantity: number
  unitPrice?: number
  unitPriceCents?: number
  totalPrice?: number
  totalPriceCents?: number
}

export interface OrderGroup {
  id: string
  status: OrderGroupStatus
  shipment?: { trackingNumber: string; carrier?: string } | null
  items: OrderItem[]
}

export interface OrderDetail {
  id?: string
  orderNumber?: string
  buyerId?: string
  status?: OrderStatus
  createdAt?: string
  shippingAddress?: Address
  groups?: OrderGroup[]
  items?: OrderItem[]
  subtotal?: number
  shippingCost?: number
  tax?: number | null
  total?: number
  totalAmount?: number
  trackingNumber?: string
}

// ── Order Group (Seller) ─────────────────────────────────────────────
export type OrderGroupStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

export interface OrderGroupDetail {
  id: string
  orderNumber?: string
  subtotalCents?: number
  buyerId: string
  sellerId: string
  status: OrderGroupStatus
  shipment?: { trackingNumber: string; carrier?: string } | null
  items: Array<{
    productId?: string
    variantId?: string
    name?: string
    productName?: string
    imageUrl?: string
    variantOptions?: Array<{ name: string; value: string }>
    quantity: number
    unitPrice?: number
    unitPriceCents?: number
    totalPrice?: number
    totalPriceCents?: number
  }>
  totalAmount: number
  shippingAddress?: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
}

export interface OrderGroupsPage {
  items: OrderGroupDetail[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ShipOrderDTO {
  trackingNumber: string
  carrier?: string
}

// ── Settlements ───────────────────────────────────────────────────────
export interface Settlement {
  id: string
  sellerId: string
  orderGroupId?: string
  periodStart: string
  periodEnd: string
  grossAmountCents: number
  platformFeeCents: number
  netAmountCents: number
  amount?: number
  status: "PENDING" | "PAID"
  paidAt?: string
  createdAt: string
}

export interface SettlementsPage {
  items: Settlement[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Payment Types ────────────────────────────────────────────────────
export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  currency: string
  status: string
}

export interface CreatePaymentIntentDTO {
  orderId: string
  amount: number
  currency?: string
}

export interface PaymentStatusResponse {
  paymentId: string
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED"
  amount: number
  updatedAt: string
}

// ── File Upload Types ────────────────────────────────────────────────
export type FileCategory = "PRODUCT_IMAGE" | "CERTIFICATE" | "AVATAR" | "DOCUMENT"
export type FileLinkTarget = "PRODUCT" | "CERTIFICATE" | "USER"

export interface FileUploadResponse {
  fileId: string
  url: string
  contentType: string
  sizeBytes: number
}

export interface FileMetadata {
  fileId: string
  url: string
  contentType: string
  sizeBytes: number
  category: FileCategory
  ownerId: string
  createdAt: string
}

// ── Product Types ────────────────────────────────────────────────────
export type ProductStatus = "DRAFT" | "REVIEW" | "ACTIVE" | "INACTIVE" | "REJECTED"

export interface ProductVariantOption {
  type: string
  value: string
}

export interface ProductVariant {
  id: string
  sku?: string
  size?: string
  color?: string
  material?: string
  stock?: number
  price?: number | null
  imageUrls?: string[]
  options?: ProductVariantOption[]
  available?: boolean
}

export interface ProductImage {
  id?: string
  url: string
  position?: number
}

export interface ProductSeller {
  userId?: string
  companyName?: string
  firstName?: string
  lastName?: string
}

export interface ProductDetail {
  id: string
  slug: string
  /** Public-facing product name */
  name: string
  /** Internal title used by seller (may equal name) */
  title?: string
  shortDesc?: string
  description?: string
  /** Base price in euros */
  basePrice?: number
  price?: number
  taxRate?: number
  currency?: string
  images?: ProductImage[]
  imageUrls?: string[]
  category?: { id?: string; name: string } | null
  categoryId?: string
  seller?: ProductSeller
  sellerId?: string
  status?: ProductStatus | string
  variants?: ProductVariant[]
  certificates?: PublicCertificate[]
  createdAt?: string
  updatedAt?: string
}

export interface ProductInternalDetail extends ProductDetail {
  title: string
}

/** Lightweight product item used in listing pages */
export interface ProductListItem {
  id: string
  slug?: string
  title?: string
  name?: string
  price?: number
  basePrice?: number
  imageUrl?: string
  images?: ProductImage[]
  status?: ProductStatus | string
  sellerId?: string
  createdAt?: string
}

export interface ProductListParams {
  search?: string
  categoryId?: string
  sellerId?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  page?: number
  size?: number
}

export interface ProductPage {
  content: ProductDetail[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ProductCreateDTO {
  name?: string
  title?: string
  description?: string
  shortDesc?: string
  basePrice?: number
  price?: number
  taxRate?: number
  currency?: string
  categoryId?: string
  imageUrls?: string[]
}

export interface ProductUpdateDTO {
  name?: string
  title?: string
  description?: string
  shortDesc?: string
  basePrice?: number
  price?: number
  taxRate?: number
  currency?: string
  categoryId?: string
}

export interface ProductStatusUpdateDTO {
  status: ProductStatus | string
}

export interface ProductCommandResponse {
  id: string
  status: string
}

export interface ProductImageCreateDTO {
  imageUrl: string
  position?: number
}

export interface ProductImageReorderDTO {
  imageIds: string[]
}

export interface ProductVariantInput {
  sku?: string
  size?: string
  color?: string
  material?: string
  stock: number
  price: number
  imageUrls?: string[]
}

// ── Recommendations ──────────────────────────────────────────────────
export interface Recommendation {
  productId: string
  slug: string
  name: string
  price?: number
  basePrice?: number
  imageUrl?: string
  score: number
  matchScore?: number
}
