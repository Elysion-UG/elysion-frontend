import { z } from "zod"
import { apiRequest } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"
import type { Cart, CartItem, AddToCartDTO, UpdateCartItemDTO } from "@/src/types"

// Raw shapes of the cart route family. Zod mirrors the backend interfaces exactly
// and is validated at the boundary so a drifted cart response fails loud rather
// than rendering an incomplete cart (missing name/image/price) deep in the UI (#38).
//
// Display data is server-owned (BE docs/api/cart.md, "Display Data Is Server-Owned"):
// every line carries name, slug, primary image, SKU and the human-readable variant
// options. The client therefore never needs a local product cache to render a cart
// correctly — see CartContext (#188).

const apiCartVariantOptionSchema = z.object({
  type: z.string(),
  value: z.string(),
})

// `options` is contractually always present and never null (BE #233). It stays
// optional here on purpose: it is decoration, and during a rolling backend deploy
// an older instance may still answer without it. Missing options must not take the
// whole cart down — name, image and price are the correctness-relevant fields.
const apiCartVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  options: z.array(apiCartVariantOptionSchema).nullish(),
})

const apiCartProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  primaryImage: z.string().nullable(),
})

const apiCartItemSchema = z.object({
  id: z.string(),
  product: apiCartProductSchema,
  variant: apiCartVariantSchema.nullable(),
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
  currency: z.string().nullable(),
  items: z.array(apiCartItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

type ApiCart = z.infer<typeof apiCartSchema>
type ApiCartItem = z.infer<typeof apiCartItemSchema>

// The backend names the option label `type` (free text, e.g. "COLOR"), the UI
// renders `name: value`. Mapping happens here so every consumer sees one shape.
function normalizeApiCartItem(item: ApiCartItem): CartItem {
  return {
    id: item.id,
    productId: item.product.id,
    productName: item.product.name,
    productSlug: item.product.slug,
    imageUrl: item.product.primaryImage ?? undefined,
    variantId: item.variant?.id,
    variantSku: item.variant?.sku,
    variantOptions: (item.variant?.options ?? []).map((o) => ({ name: o.type, value: o.value })),
    quantity: item.quantity,
    priceSnapshot: item.unitPrice,
    lineTotal: item.lineTotal,
    currency: item.currency,
  }
}

function normalizeApiCart(api: ApiCart): Cart {
  return {
    id: api.id,
    totalAmount: api.subtotal,
    items: api.items.map(normalizeApiCartItem),
  }
}

export const CartService = {
  async get(): Promise<Cart> {
    const data = await apiRequest<unknown>("/api/v1/cart")
    return normalizeApiCart(parseApiResponse(apiCartSchema, data, "cart.get"))
  },

  /**
   * Adds a variant to the resolved cart.
   *
   * Returns the **affected line only** (`CartItemResponse`), not the whole cart —
   * and it carries the server's own item id plus the full display data. Callers
   * must reconcile their optimistic line with it: adding a variant that is already
   * in the cart merges server-side, so the returned quantity can exceed the
   * requested one, and the returned id is the only one the mutation routes accept.
   */
  async addItem(dto: AddToCartDTO): Promise<CartItem> {
    const body: Record<string, unknown> = { quantity: dto.quantity }
    if (dto.variantId) body.variantId = dto.variantId
    const data = await apiRequest<unknown>("/api/v1/cart/items", {
      method: "POST",
      body: JSON.stringify(body),
    })
    return normalizeApiCartItem(parseApiResponse(apiCartItemSchema, data, "cart.addItem"))
  },

  /**
   * Replaces the quantity of one cart line and returns the updated line
   * (`CartItemResponse`, not the whole cart). `quantity <= 0` is rejected by the
   * backend and never deletes — use `removeItem` for that.
   */
  async updateItem(itemId: string, dto: UpdateCartItemDTO): Promise<CartItem> {
    const data = await apiRequest<unknown>(`/api/v1/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
    return normalizeApiCartItem(parseApiResponse(apiCartItemSchema, data, "cart.updateItem"))
  },

  async removeItem(itemId: string): Promise<void> {
    return apiRequest<void>(`/api/v1/cart/items/${itemId}`, {
      method: "DELETE",
    })
  },
}
