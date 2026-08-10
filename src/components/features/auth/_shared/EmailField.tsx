"use client"

import { useId } from "react"
import { Mail } from "lucide-react"
import { Input } from "@/src/components/ui/input"

type Variant = "light" | "dark"

interface EmailFieldProps {
  label?: string
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
    label: "mb-1 block text-sm font-medium text-foreground",
    input: "",
    icon: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
  },
  dark: {
    label: "mb-1.5 block text-xs font-medium uppercase tracking-wider text-sand-page/60",
    input: "border-border/60 bg-ink-900/60 text-sand-page placeholder:text-sand-page/40",
    icon: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-page/50",
  },
} satisfies Record<Variant, Record<string, string>>

export function EmailField({
  label,
  value,
  onChange,
  placeholder = "ihre@email.de",
  required,
  variant = "light",
  autoComplete = "email",
  id,
}: EmailFieldProps) {
  const reactId = useId()
  const fieldId = id ?? reactId
  const s = styles[variant]

  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className={s.label}>
          {label}
        </label>
      )}
      <div className="relative">
        <Mail className={s.icon} />
        <Input
          id={fieldId}
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`pl-10 ${s.input}`.trim()}
        />
      </div>
    </div>
  )
}
