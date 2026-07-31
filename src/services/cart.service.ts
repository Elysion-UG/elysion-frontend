import { z } from "zod"
import { apiRequest } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"
import type { Cart, AddToCartDTO, UpdateCartItemDTO } from "@/src/types"

// Raw shape returned by GET /api/v1/cart. Zod mirrors the interface exactly and
// is validated at the boundary so a drifted cart response fails loud rather than
// rendering an incomplete cart (missing name/image/price) deep in the UI (#38).
const apiCartItemSchema = z.object({
  id: z.string(),
  product: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    primaryImage: z.string().nullable(),
  }),
  variant: z.object({ id: z.string(), sku: z.string() }).nullable(),
  quantity: z.number(),
  unitPrice: z.number(),
  currency: z.string(),
  lineTotal: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const apiCartSchema = z.object({
  id: z.string(),
  ownershipType: z.string(),
  totalQuantity: z.number(),
  subtotal: z.number(),
  currency: z.string(),
  items: z.array(apiCartItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

type ApiCart = z.infer<typeof apiCartSchema>

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
    const data = await apiRequest<unknown>("/api/v1/cart")
    return normalizeApiCart(parseApiResponse(apiCartSchema, data, "cart.get"))
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
