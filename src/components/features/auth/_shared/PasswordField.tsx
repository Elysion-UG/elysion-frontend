"use client"

import { useId, useState } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"

type Variant = "light" | "dark"

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  variant?: Variant
  autoComplete?: string
  id?: string
}

const styles = {
  light: {
    label: "mb-1.5 block text-sm font-medium text-stone-700",
    input:
      "w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-10 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20",
    icon: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400",
    toggle: "absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600",
  },
  dark: {
    label: "mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500",
    input:
      "w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-2.5 pl-10 pr-10 text-slate-100 placeholder-slate-600 focus:border-cyber-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20",
    icon: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600",
    toggle: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400",
  },
} satisfies Record<Variant, Record<string, string>>

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  required,
  variant = "light",
  autoComplete = "current-password",
  id,
}: PasswordFieldProps) {
  const reactId = useId()
  const fieldId = id ?? reactId
  const [show, setShow] = useState(false)
  const s = styles[variant]

  return (
    <div>
      <label htmlFor={fieldId} className={s.label}>
        {label}
      </label>
      <div className="relative">
        <Lock className={s.icon} />
        <input
          id={fieldId}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={s.input}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className={s.toggle}
          aria-label={show ? "Passwort verbergen" : "Passwort anzeigen"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
