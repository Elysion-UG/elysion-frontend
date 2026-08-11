import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { AddressService } from "./address.service"
import type { Address, AddressDTO } from "@/src/types"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

const mockAddress: Address = {
  id: "addr-1",
  type: "SHIPPING",
  firstName: "Jane",
  lastName: "Doe",
  street: "Musterstraße",
  houseNumber: "1",
  postalCode: "12345",
  city: "Berlin",
  country: "DE",
  isDefault: true,
}

const mockAddressDTO: AddressDTO = {
  type: "SHIPPING",
  firstName: "Jane",
  lastName: "Doe",
  street: "Musterstraße",
  houseNumber: "1",
  postalCode: "12345",
  city: "Berlin",
  country: "DE",
  isDefault: false,
}

describe("AddressService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("getAll — calls GET /api/v1/users/me/addresses and returns address list", async () => {
    mockApiRequest.mockResolvedValue([mockAddress])

    const result = await AddressService.getAll()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/addresses")
    expect(result).toEqual([mockAddress])
  })

  it("create — calls POST /api/v1/users/me/addresses with body and returns address", async () => {
    mockApiRequest.mockResolvedValue(mockAddress)

    const result = await AddressService.create(mockAddressDTO)

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/addresses",
      expect.objectContaining({ method: "POST", body: JSON.stringify(mockAddressDTO) })
    )
    expect(result).toEqual(mockAddress)
  })

  it("update — calls PATCH /api/v1/users/me/addresses/:id with body and returns updated address", async () => {
    const patch = { city: "Hamburg" }
    mockApiRequest.mockResolvedValue({ ...mockAddress, city: "Hamburg" })

    const result = await AddressService.update("addr-1", patch)

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/addresses/addr-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(patch) })
    )
    expect(result).toMatchObject({ city: "Hamburg" })
  })

  it("setDefault — calls PATCH /api/v1/users/me/addresses/:id/default and returns address", async () => {
    mockApiRequest.mockResolvedValue({ ...mockAddress, isDefault: true })

    const result = await AddressService.setDefault("addr-1")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/addresses/addr-1/default",
      expect.objectContaining({ method: "PATCH" })
    )
    expect(result).toMatchObject({ isDefault: true })
  })

  it("getAll — accepts the BOTH address type the backend allows", async () => {
    mockApiRequest.mockResolvedValue([{ ...mockAddress, type: "BOTH" }])

    const result = await AddressService.getAll()

    expect(result[0].type).toBe("BOTH")
  })

  it("getAll — throws when an address loses a field the checkout needs (#38)", async () => {
    const { postalCode: _postalCode, ...drifted } = mockAddress
    mockApiRequest.mockResolvedValue([drifted])

    await expect(AddressService.getAll()).rejects.toThrow(/Ungültige Server-Antwort/)
  })

  it("create — throws on an unknown address type", async () => {
    mockApiRequest.mockResolvedValue({ ...mockAddress, type: "PICKUP_STATION" })

    await expect(AddressService.create(mockAddressDTO)).rejects.toThrow(
      /Ungültige Server-Antwort/
    )
  })

  it("remove — calls DELETE /api/v1/users/me/addresses/:id", async () => {
    mockApiRequest.mockResolvedValue(null)

    await AddressService.remove("addr-1")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/addresses/addr-1",
      expect.objectContaining({ method: "DELETE" })
    )
  })
})
