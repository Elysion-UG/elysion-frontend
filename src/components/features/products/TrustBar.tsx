import { ShieldCheck, Leaf, Users, Recycle } from "lucide-react"

const trustItems = [
  { icon: ShieldCheck, label: "Geprüfte Zertifikate", sub: "100% verifiziert" },
  { icon: Leaf, label: "Bio & Fair Trade", sub: "Nachhaltige Qualität" },
  { icon: Users, label: "Direkt vom Hersteller", sub: "Keine Zwischenhändler" },
  { icon: Recycle, label: "Kreislaufwirtschaft", sub: "Ressourcenschonend" },
]

export default function TrustBar() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {trustItems.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-xl border border-stone-100 bg-white px-4 py-4 text-center shadow-sm"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-50">
            <Icon className="h-4 w-4 text-sage-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-700">{label}</p>
            <p className="text-[11px] text-stone-400">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
