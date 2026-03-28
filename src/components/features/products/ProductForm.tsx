"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import { CategoryService } from "@/src/services/category.service"
import type { ProductCreateDTO, ProductUpdateDTO, ProductCommandResponse, Category } from "@/src/types"
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

export default function ProductForm({ productId, initialValues, onClose, onSaved }: ProductFormProps) {
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
    CategoryService.list().then(setCategories).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Bitte Produktname eingeben."); return }
    if (!description.trim()) { toast.error("Bitte Beschreibung eingeben."); return }
    if (!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) <= 0) {
      toast.error("Bitte gültigen Preis eingeben.")
      return
    }
    if (!categoryId) { toast.error("Bitte Kategorie auswählen."); return }

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

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {isEdit ? "Produkt bearbeiten" : "Neues Produkt erstellen"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Produktname *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Bio-Baumwoll-T-Shirt"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kurzbeschreibung</label>
            <input
              type="text"
              value={shortDesc}
              onChange={e => setShortDesc(e.target.value)}
              placeholder="1–2 Sätze für die Produktliste"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Detaillierte Produktbeschreibung..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preis (EUR) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={basePrice}
                onChange={e => setBasePrice(e.target.value)}
                placeholder="29.99"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">MwSt. (%)</label>
              <select
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="7">7%</option>
                <option value="19">19%</option>
                <option value="0">0%</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie *</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Kategorie auswählen...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              Das Produkt wird als <strong>Entwurf</strong> erstellt. Nach dem Erstellen können Sie Bilder hinzufügen und das Produkt zur Prüfung einreichen.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Speichern" : "Produkt erstellen"}
          </button>
        </div>
      </div>
    </div>
  )
}
