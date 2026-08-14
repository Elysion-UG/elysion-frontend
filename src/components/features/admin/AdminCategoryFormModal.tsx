"use client"

import { useId } from "react"
import { X, Loader2 } from "lucide-react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"

export interface FormState {
  name: string
  slug: string
  parentId: string
  description: string
  order: string
}

export const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  parentId: "",
  description: "",
  order: "0",
}

/** Exported so the submit handlers can re-derive a slug when the field is blank. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

interface AdminCategoryFormModalProps {
  title: string
  form: FormState
  onChange: (form: FormState) => void
  onSubmit: () => void
  onClose: () => void
  isSaving: boolean
  parentOptions: { id: string; name: string; level: number }[]
  /** Hide parent selector when editing (parent cannot be changed). */
  hideParent?: boolean
  /** Inline error shown when the save request failed; keeps the modal open (#178). */
  error?: string | null
}

export default function AdminCategoryFormModal({
  title,
  form,
  onChange,
  onSubmit,
  onClose,
  isSaving,
  parentOptions,
  hideParent,
  error,
}: AdminCategoryFormModalProps) {
  const handleNameChange = (name: string) => {
    onChange({ ...form, name, slug: slugify(name) })
  }

  // Focus trap + Escape-to-close for keyboard/screen-reader accessibility (#11).
  const modalRef = useFocusTrap(onClose)

  // Stable, unique ids to associate each label with its field (#11).
  const uid = useId()
  const titleId = `${uid}-title`
  const nameId = `${uid}-name`
  const slugId = `${uid}-slug`
  const parentId = `${uid}-parent`
  const descriptionId = `${uid}-description`
  const orderId = `${uid}-order`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/70" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl border border-border/60 bg-ink-900 p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="font-mono text-lg font-semibold text-muted-foreground">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground [&_svg]:size-5"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor={nameId}
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Name *
            </label>
            <Input
              id={nameId}
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="h-9 border-border/60 bg-ink-900/60 px-3 text-sm text-muted-foreground"
              placeholder="z.B. Bio-Textilien"
            />
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor={slugId}
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Slug
            </label>
            <Input
              id={slugId}
              type="text"
              value={form.slug}
              onChange={(e) => onChange({ ...form, slug: e.target.value })}
              className="h-9 border-border/60 bg-ink-900/60 px-3 font-mono text-sm text-muted-foreground"
              placeholder="auto-generiert"
            />
          </div>

          {/* Parent */}
          {!hideParent && (
            <div>
              <label
                htmlFor={parentId}
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Eltern-Kategorie
              </label>
              {/* Für <select> gibt es kein Primitive — die Feld-Optik von <Input>
                  steht hier deshalb von Hand (Guide 03: Radius 12, Hairline,
                  3-px-Grün-Fokusring). */}
              <select
                id={parentId}
                value={form.parentId}
                onChange={(e) => onChange({ ...form, parentId: e.target.value })}
                className="h-9 w-full rounded-xl border-[1.5px] border-border/60 bg-ink-900/60 px-3 text-sm text-muted-foreground transition-[color,border-color,box-shadow] duration-200 ease-brand focus-visible:border-green-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-green-500/40"
              >
                <option value="">Keine (Root)</option>
                {parentOptions
                  .filter((p) => p.level < 3)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {"—".repeat(p.level - 1)} {p.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label
              htmlFor={descriptionId}
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Beschreibung
            </label>
            <Textarea
              id={descriptionId}
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              rows={2}
              className="min-h-0 border-border/60 bg-ink-900/60 px-3 py-2 text-sm text-muted-foreground"
              placeholder="Optionale Beschreibung..."
            />
          </div>

          {/* Order */}
          <div>
            <label
              htmlFor={orderId}
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Sortierung
            </label>
            <Input
              id={orderId}
              type="number"
              value={form.order}
              onChange={(e) => onChange({ ...form, order: e.target.value })}
              className="h-9 border-border/60 bg-ink-900/60 px-3 text-sm text-muted-foreground"
              min={0}
              step={1}
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-danger-tint"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border/60 bg-ink-900/60 text-muted-foreground"
          >
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={isSaving || !form.name.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </div>
    </div>
  )
}
