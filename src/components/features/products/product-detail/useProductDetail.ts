"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ProductService } from "@/src/services/product.service"
import { CertificateService } from "@/src/services/certificate.service"
import type { ProductDetail, ProductVariant, PublicCertificate } from "@/src/types"

export interface UseProductDetailResult {
  product: ProductDetail | null
  certificates: PublicCertificate[]
  isLoading: boolean
  error: string | null
  selectedVariant: ProductVariant | null
  setSelectedVariant: (v: ProductVariant | null) => void
}

export function useProductDetail(slug: string | null): UseProductDetailResult {
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [certificates, setCertificates] = useState<PublicCertificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  useEffect(() => {
    if (!slug) {
      setError("Kein Produkt ausgewählt.")
      setIsLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const data = await ProductService.getBySlug(slug)
        if (cancelled) return
        setProduct(data)
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0])
        }
        CertificateService.getProductCertificates(data.id)
          .then((certs) => {
            if (!cancelled) setCertificates(certs)
          })
          .catch(() => {
            if (!cancelled) toast.error("Zertifikate konnten nicht geladen werden.")
          })
      } catch {
        if (!cancelled) setError("Produkt konnte nicht geladen werden.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [slug])

  return { product, certificates, isLoading, error, selectedVariant, setSelectedVariant }
}
