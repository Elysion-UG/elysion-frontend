import { Home, Search } from "lucide-react"

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
        <Search className="h-7 w-7 text-slate-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-100">Seite nicht gefunden</h2>
      <p className="max-w-sm text-sm text-slate-400">
        Die angeforderte Admin-Seite existiert nicht oder wurde verschoben.
      </p>
      <a
        href="/admin/users"
        className="inline-flex items-center gap-2 rounded-md bg-cyber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyber-700"
      >
        <Home className="h-4 w-4" />
        Admin-Startseite
      </a>
    </div>
  )
}
