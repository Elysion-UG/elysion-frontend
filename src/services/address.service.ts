/**
 * AddressService — abstract service layer for address CRUD.
 */
import type { Address, AddressDTO } from "@/src/types"

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

let mockAddresses: Address[] = [
  {
    id: "addr_1",
    type: "SHIPPING",
    firstName: "Max",
    lastName: "Mustermann",
    street: "Musterstrasse",
    houseNumber: "123",
    postalCode: "12345",
    city: "Musterstadt",
    country: "Deutschland",
    isDefault: true,
  },
  {
    id: "addr_2",
    type: "BILLING",
    firstName: "Max",
    lastName: "Mustermann",
    street: "Firmenstrasse",
    houseNumber: "45",
    postalCode: "54321",
    city: "Arbeitsstadt",
    country: "Deutschland",
    isDefault: false,
  },
]

export const AddressService = {
  async getAll(): Promise<Address[]> {
    await delay()
    return [...mockAddresses]
  },

  async create(dto: AddressDTO): Promise<Address> {
    await delay()
    const addr: Address = { ...dto, id: `addr_${Date.now()}` }
    if (addr.isDefault) mockAddresses = mockAddresses.map((a) => ({ ...a, isDefault: false }))
    mockAddresses.push(addr)
    return addr
  },

  async update(id: string, dto: AddressDTO): Promise<Address> {
    await delay()
    if (dto.isDefault) mockAddresses = mockAddresses.map((a) => ({ ...a, isDefault: false }))
    mockAddresses = mockAddresses.map((a) => (a.id === id ? { ...dto, id } : a))
    return { ...dto, id }
  },

  async remove(id: string): Promise<void> {
    await delay()
    mockAddresses = mockAddresses.filter((a) => a.id !== id)
  },

  async setDefault(id: string): Promise<void> {
    await delay()
    mockAddresses = mockAddresses.map((a) => ({ ...a, isDefault: a.id === id }))
  },
}
