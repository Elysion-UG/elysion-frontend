/**
 * AddressService — real API calls for address CRUD.
 *
 * Endpoints (base: /api/v1/users/me/addresses):
 *   GET    /                — list all addresses (default first, then by updatedAt desc)
 *   POST   /                — create address; first address auto-becomes default
 *   PATCH  /{id}            — partial update (all fields optional)
 *   PATCH  /{id}/default    — set as default (bulk switch)
 *   DELETE /{id}            — delete; next address auto-promoted to default if needed
 *
 * Alle Lese- und Schreibantworten liefern `UserAddressResponse` und werden an
 * der Grenze gegen Zod geprüft (#38) — die Adresse geht direkt in den Checkout,
 * ein fehlendes Feld darf hier nicht stumm als `undefined` durchlaufen.
 */
import { z } from "zod"
import { apiRequest } from "@/src/lib/api-client"
import { addressTypeSchema, parseApiResponse } from "@/src/lib/api-schemas"
import type { Address, AddressDTO } from "@/src/types"

const apiAddressSchema = z.object({
  id: z.string(),
  // `AddressType` im Backend kennt neben SHIPPING/BILLING auch BOTH, und die
  // Create-Route nimmt den Wert ungefiltert an. Ein hartes SHIPPING|BILLING
  // hätte die ganze Adressliste an einer einzigen BOTH-Adresse scheitern lassen.
  type: addressTypeSchema,
  firstName: z.string(),
  lastName: z.string(),
  street: z.string(),
  houseNumber: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
  isDefault: z.boolean(),
})

const apiAddressListSchema = z.array(apiAddressSchema)

export const AddressService = {
  async getAll(): Promise<Address[]> {
    const raw = await apiRequest<unknown>("/api/v1/users/me/addresses")
    return parseApiResponse(apiAddressListSchema, raw, "address.getAll")
  },

  async create(dto: AddressDTO): Promise<Address> {
    const raw = await apiRequest<unknown>("/api/v1/users/me/addresses", {
      method: "POST",
      body: JSON.stringify(dto),
    })
    return parseApiResponse(apiAddressSchema, raw, "address.create")
  },

  async update(id: string, dto: Partial<AddressDTO>): Promise<Address> {
    const raw = await apiRequest<unknown>(`/api/v1/users/me/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
    return parseApiResponse(apiAddressSchema, raw, "address.update")
  },

  async setDefault(id: string): Promise<Address> {
    const raw = await apiRequest<unknown>(`/api/v1/users/me/addresses/${id}/default`, {
      method: "PATCH",
    })
    return parseApiResponse(apiAddressSchema, raw, "address.setDefault")
  },

  async remove(id: string): Promise<void> {
    await apiRequest(`/api/v1/users/me/addresses/${id}`, {
      method: "DELETE",
    })
  },
}
