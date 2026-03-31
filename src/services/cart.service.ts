import { apiRequest } from "@/src/lib/api-client"
import type { Cart, AddToCartDTO, UpdateCartItemDTO } from "@/src/types"

export const CartService = {
  async get(): Promise<Cart> {
    return apiRequest<Cart>("/api/v1/cart")
  },

  async addItem(dto: AddToCartDTO): Promise<void> {
    return apiRequest<void>("/api/v1/cart/items", {
      method: "POST",
      body: JSON.stringify({ variantId: dto.variantId, quantity: dto.quantity }),
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
