"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, ArrowUp, ArrowDown, Loader2, ImageIcon } from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import { FileService } from "@/src/services/file.service"
import type { ProductImage } from "@/src/types"
import { toast } from "sonner"
import { Button } from "@/src/components/ui/button"

interface ProductImageManagerProps {
  productId: string
  initialImages: ProductImage[]
}

/**
 * Bildverwaltung im Produktformular des Verkäufers.
 *
 * Zeigt ausschließlich, was in dieser Sitzung hochgeladen wurde (plus optionale
 * `initialImages`) — **es gibt kein Nachladen** (#234). Kein Lesepfad im
 * Seller-Kontext liefert die Bilder eines Produkts:
 *
 *   • `GET /api/v1/products/by-id/{id}` (der frühere Nachlade-Aufruf hier) führt
 *     im DTO gar kein `images` — der Request war wirkungslos, die Komponente lief
 *     immer über den Fallback. Zusätzlich lud `ProductForm` dasselbe Produkt für
 *     die Materialien bereits, es war also ein zweiter, identischer Request.
 *   • `GET /api/v1/seller/products` hat nur `primaryImage` — eine URL **ohne ID**
 *     und damit weder für `DELETE …/images/{imageId}` noch für
 *     `PATCH …/images/order` (Body `imageIds`) brauchbar.
 *   • Der öffentliche Detail-Read führt Bilder, ist aber hart auf `ACTIVE`
 *     gefiltert — beim Bearbeiten ist ein Produkt regelmäßig `DRAFT`.
 *
 * Das Nachladen braucht ein Backend-Gegenstück (Seller-Read mit `images[]` inkl.
 * `id`, über alle Status). Bis dahin sagt der Leerzustand das offen, statt „keine
 * Bilder vorhanden" als Tatsache über das Produkt zu behaupten.
 */
export default function ProductImageManager({
  productId,
  initialImages,
}: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Bitte nur Bilddateien hochladen.")
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxSize) {
      toast.error("Datei ist zu gross (max. 10 MB).")
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await FileService.upload(file, "PRODUCT_IMAGE")
      await ProductService.addImage(productId, {
        fileId: uploaded.fileId,
        order: images.length,
      })
      const newImage: ProductImage = {
        id: uploaded.fileId,
        url: uploaded.url,
        position: images.length,
      }
      setImages((prev) => [...prev, newImage])
      toast.success("Bild hochgeladen.")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Hochladen."
      toast.error(msg)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDelete = async (imageId: string) => {
    try {
      await ProductService.deleteImage(productId, imageId)
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      toast.success("Bild entfernt.")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Entfernen."
      toast.error(msg)
    }
  }

  const handleMove = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= images.length) return

    const reordered = [...images]
    const temp = reordered[index]
    reordered[index] = reordered[swapIndex]
    reordered[swapIndex] = temp

    const updatedImages = reordered.map((img, i) => ({ ...img, position: i }))
    setImages(updatedImages)

    const imageIds = updatedImages.map((img) => img.id).filter((id): id is string => !!id)

    if (imageIds.length > 0) {
      try {
        await ProductService.reorderImages(productId, { imageIds })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Fehler beim Sortieren."
        toast.error(msg)
        setImages(images)
      }
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground">Produktbilder</h4>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-4 py-8 text-center text-muted-foreground">
          <ImageIcon className="mb-2 h-8 w-8" />
          <p className="text-sm">Noch keine Bilder in dieser Sitzung hinzugefügt.</p>
          <p className="mt-1 max-w-sm text-xs">
            Bereits hochgeladene Bilder werden hier derzeit nicht angezeigt — sie lassen sich über
            das Verkäuferportal noch nicht auslesen. Neu hochgeladene Bilder kommen zum Produkt
            hinzu, sie ersetzen die vorhandenen nicht.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => {
            const imageId = image.id
            return (
              <div
                key={imageId ?? index}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
              >
                <Image
                  src={image.url}
                  alt={`Produktbild ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                {imageId && (
                  <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(imageId)}
                      className="h-6 w-6 rounded-full [&_svg]:size-3.5"
                      title="Bild entfernen"
                      aria-label="Bild entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMove(index, "up")}
                      className="h-6 w-6 rounded-full bg-white/90 text-foreground hover:bg-white hover:text-foreground [&_svg]:size-3.5"
                      title="Nach vorne"
                      aria-label="Nach vorne"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {index < images.length - 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMove(index, "down")}
                      className="h-6 w-6 rounded-full bg-white/90 text-foreground hover:bg-white hover:text-foreground [&_svg]:size-3.5"
                      title="Nach hinten"
                      aria-label="Nach hinten"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="absolute left-1 top-1 rounded-full bg-ink-900/60 px-2 py-0.5 text-[10px] font-medium text-sand-page">
                  {index + 1}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          id={`image-upload-${productId}`}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Wird hochgeladen..." : "Bild hinzufuegen"}
        </Button>
      </div>
    </div>
  )
}
