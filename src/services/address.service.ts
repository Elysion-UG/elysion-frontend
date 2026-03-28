/**
 * AddressService — real API calls for address CRUD.
 *
 * Endpoints (base: /api/v1/users/me/addresses):
 *   GET    /                — list all addresses (default first, then by updatedAt desc)
 *   POST   /                — create address; first address auto-becomes default
 *   PATCH  /{id}            — partial update (all fields optional)
 *   PATCH  /{id}/default    — set as default (bulk switch)
 *   DELETE /{id}            — delete; next address auto-promoted to default if needed
 */
import { apiRequest } from "@/src/lib/api-client"
import type { Address, AddressDTO } from "@/src/types"

export const AddressService = {
  async getAll(): Promise<Address[]> {
    return apiRequest<Address[]>("/api/v1/users/me/addresses")
  },

  async create(dto: AddressDTO): Promise<Address> {
    return apiRequest<Address>("/api/v1/users/me/addresses", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async update(id: string, dto: Partial<AddressDTO>): Promise<Address> {
    return apiRequest<Address>(`/api/v1/users/me/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async setDefault(id: string): Promise<Address> {
    return apiRequest<Address>(`/api/v1/users/me/addresses/${id}/default`, {
      method: "PATCH",
    })
  },

  async remove(id: string): Promise<void> {
    await apiRequest(`/api/v1/users/me/addresses/${id}`, {
      method: "DELETE",
    })
  },
}
