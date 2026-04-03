import { apiRequest } from "@/src/lib/api-client"
import type { Cart, AddToCartDTO, UpdateCartItemDTO } from "@/src/types"

// Raw shape returned by GET /api/v1/cart
interface ApiCartItem {
  id: string
  product: {
    id: string
    slug: string
    name: string
    primaryImage: string | null
  }
  variant: {
    id: string
    sku: string
  } | null
  quantity: number
  unitPrice: number
  currency: string
  lineTotal: number
  createdAt: string
  updatedAt: string
}

interface ApiCart {
  id: string
  ownershipType: string
  totalQuantity: number
  subtotal: number
  currency: string
  items: ApiCartItem[]
  createdAt: string
  updatedAt: string
}

function normalizeApiCart(api: ApiCart): Cart {
  return {
    id: api.id,
    totalAmount: api.subtotal,
    items: api.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      imageUrl: item.product.primaryImage ?? undefined,
      variantId: item.variant?.id,
      quantity: item.quantity,
      priceSnapshot: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
  }
}

export const CartService = {
  async get(): Promise<Cart> {
    const data = await apiRequest<ApiCart>("/api/v1/cart")
    return normalizeApiCart(data)
  },

  async addItem(dto: AddToCartDTO): Promise<void> {
    const body: Record<string, unknown> = { quantity: dto.quantity }
    if (dto.variantId) body.variantId = dto.variantId
    return apiRequest<void>("/api/v1/cart/items", {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  async updateItem(itemId: string, dto: UpdateCartItemDTO): Promise<void> {
    return apiRequest<void>(`/api/v1/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async removeItem(itemId: string): Promise<void> {
    return apiRequest<void>(`/api/v1/cart/items/${itemId}`, {
      method: "DELETE",
    })
  },
}
