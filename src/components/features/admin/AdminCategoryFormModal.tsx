"use client"

import { X, Loader2 } from "lucide-react"

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

function slugify(text: string): string {
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
}: AdminCategoryFormModalProps) {
  const handleNameChange = (name: string) => {
    onChange({ ...form, name, slug: slugify(name) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-mono text-lg font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
              placeholder="z.B. Bio-Textilien"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => onChange({ ...form, slug: e.target.value })}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 font-mono text-sm text-slate-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
              placeholder="auto-generiert"
            />
          </div>

          {/* Parent */}
          {!hideParent && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Eltern-Kategorie
              </label>
              <select
                value={form.parentId}
                onChange={(e) => onChange({ ...form, parentId: e.target.value })}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
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
            <label className="mb-1 block text-xs font-medium text-slate-400">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
              placeholder="Optionale Beschreibung..."
            />
          </div>

          {/* Order */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Sortierung</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => onChange({ ...form, order: e.target.value })}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
              min={0}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
          >
            Abbrechen
          </button>
          <button
            onClick={onSubmit}
            disabled={isSaving || !form.name.trim()}
            className="flex items-center gap-2 rounded-lg bg-cyber-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyber-500 disabled:opacity-40"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
