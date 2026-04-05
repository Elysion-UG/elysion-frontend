"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Upload, X, ArrowUp, ArrowDown, Loader2, ImageIcon } from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import { FileService } from "@/src/services/file.service"
import type { ProductImage } from "@/src/types"
import { toast } from "sonner"

interface ProductImageManagerProps {
  productId: string
  initialImages: ProductImage[]
}

export default function ProductImageManager({
  productId,
  initialImages,
}: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    const fetchImages = async () => {
      setIsLoading(true)
      try {
        const detail = await ProductService.getById(productId)
        if (!cancelled && detail.images) {
          setImages(detail.images)
        }
      } catch {
        // Fall back to initialImages — already set
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchImages()
    return () => {
      cancelled = true
    }
  }, [productId])

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
      <h4 className="text-sm font-semibold text-slate-700">Produktbilder</h4>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 py-8 text-slate-400">
          <ImageIcon className="mb-2 h-8 w-8" />
          <p className="text-sm">Noch keine Bilder vorhanden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => {
            const imageId = image.id
            return (
              <div
                key={imageId ?? index}
                className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
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
                    <button
                      onClick={() => handleDelete(imageId)}
                      className="rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                      title="Bild entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {index > 0 && (
                    <button
                      onClick={() => handleMove(index, "up")}
                      className="rounded-full bg-white/90 p-1 text-slate-600 shadow hover:bg-white"
                      title="Nach vorne"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      onClick={() => handleMove(index, "down")}
                      className="rounded-full bg-white/90 p-1 text-slate-600 shadow hover:bg-white"
                      title="Nach hinten"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="absolute left-1 top-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
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
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Wird hochgeladen..." : "Bild hinzufuegen"}
        </button>
      </div>
    </div>
  )
}
