"use client"

import { useId, useState } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { Input } from "@/src/components/ui/input"

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

// Radius, Rahmenstärke, Fokus und Transition kommen aus dem Input-Primitive —
// hier bleibt nur, was zwischen heller und dunkler Oberfläche wirklich abweicht.
const styles = {
  light: {
    label: "mb-1.5 block text-sm font-medium text-foreground",
    input: "",
    icon: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
    toggle: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
  },
  dark: {
    label: "mb-1.5 block text-xs font-medium uppercase tracking-wider text-sand-page/60",
    input: "border-border/60 bg-ink-900/60 text-sand-page placeholder:text-sand-page/40",
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
        <Input
          id={fieldId}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${s.input}`.trim()}
        />
        {/* Bewusst kein <Button>: der Toggle sitzt flächenlos im Feld — die
            Ghost-Variante würde eine Hover-Fläche in den Input malen. */}
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
