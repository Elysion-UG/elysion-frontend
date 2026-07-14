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
    label: "mb-1.5 block text-sm font-medium text-foreground",
    input:
      "w-full rounded-xl border border-border py-2.5 pl-10 pr-10 text-foreground focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/20",
    icon: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
    toggle: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
  },
  dark: {
    label: "mb-1.5 block text-xs font-medium uppercase tracking-wider text-sand-page/60",
    input:
      "w-full rounded-xl border border-border/60 bg-ink-900/60 py-2.5 pl-10 pr-10 text-sand-page placeholder-sand-page/40 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/20",
    icon: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-page/50",
    toggle: "absolute right-3 top-1/2 -translate-y-1/2 text-foreground hover:text-muted-foreground",
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
