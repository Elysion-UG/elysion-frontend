import { useQuery } from "@tanstack/react-query"
import { UserService } from "@/src/services/user.service"
import { AddressService } from "@/src/services/address.service"

export function useUserProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => UserService.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: () => AddressService.getAll(),
    staleTime: 2 * 60 * 1000,
  })
}
