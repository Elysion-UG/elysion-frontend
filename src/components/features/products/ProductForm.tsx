"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { ProductService } from "@/src/services/product.service"
import { CategoryService } from "@/src/services/category.service"
import type {
  ProductCreateDTO,
  ProductUpdateDTO,
  ProductCommandResponse,
  Category,
} from "@/src/types"
import { toast } from "sonner"

interface ProductFormProps {
  /** If provided, form is in edit mode */
  productId?: string
  /** Pre-fill values for edit mode */
  initialValues?: {
    name?: string
    description?: string
    shortDesc?: string
    basePrice?: number
    categoryId?: string
    taxRate?: number
    currency?: string
  }
  onClose: () => void
  onSaved: (result: ProductCommandResponse) => void
}

export default function ProductForm({
  productId,
  initialValues,
  onClose,
  onSaved,
}: ProductFormProps) {
  const isEdit = !!productId

  const [name, setName] = useState(initialValues?.name ?? "")
  const [description, setDescription] = useState(initialValues?.description ?? "")
  const [shortDesc, setShortDesc] = useState(initialValues?.shortDesc ?? "")
  const [basePrice, setBasePrice] = useState(String(initialValues?.basePrice ?? ""))
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "")
  const [taxRate, setTaxRate] = useState(String(initialValues?.taxRate ?? "19"))
  const [currency] = useState(initialValues?.currency ?? "EUR")
  const [categories, setCategories] = useState<Category[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    CategoryService.list()
      .then(setCategories)
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Bitte Produktname eingeben.")
      return
    }
    if (!description.trim()) {
      toast.error("Bitte Beschreibung eingeben.")
      return
    }
    if (!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) <= 0) {
      toast.error("Bitte gültigen Preis eingeben.")
      return
    }
    if (!categoryId) {
      toast.error("Bitte Kategorie auswählen.")
      return
    }

    setIsSaving(true)
    try {
      let result: ProductCommandResponse
      if (isEdit && productId) {
        const dto: ProductUpdateDTO = {
          name: name.trim(),
          description: description.trim(),
          shortDesc: shortDesc.trim() || undefined,
          basePrice: parseFloat(basePrice),
          categoryId,
          taxRate: parseFloat(taxRate) || 19,
          currency,
        }
        result = await ProductService.update(productId, dto)
        toast.success("Produkt aktualisiert.")
      } else {
        const dto: ProductCreateDTO = {
          name: name.trim(),
          description: description.trim(),
          shortDesc: shortDesc.trim() || undefined,
          basePrice: parseFloat(basePrice),
          categoryId,
          taxRate: parseFloat(taxRate) || 19,
          currency,
        }
        result = await ProductService.create(dto)
        toast.success("Produkt erstellt. Es befindet sich im Entwurfsstatus.")
      }
      onSaved(result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Speichern."
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const modalRef = useFocusTrap(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="my-4 w-full max-w-lg rounded-xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h3 id="product-form-title" className="text-lg font-semibold text-slate-800">
            {isEdit ? "Produkt bearbeiten" : "Neues Produkt erstellen"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Schliessen"
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Produktname *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Bio-Baumwoll-T-Shirt"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Kurzbeschreibung
            </label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="1–2 Sätze für die Produktliste"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Beschreibung *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Detaillierte Produktbeschreibung..."
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Preis (EUR) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="29.99"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">MwSt. (%)</label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="7">7%</option>
                <option value="19">19%</option>
                <option value="0">0%</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kategorie *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Kategorie auswählen...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
              Das Produkt wird als <strong>Entwurf</strong> erstellt. Nach dem Erstellen können Sie
              Bilder hinzufügen und das Produkt zur Prüfung einreichen.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-200 p-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Speichern" : "Produkt erstellen"}
          </button>
        </div>
      </div>
    </div>
  )
}
