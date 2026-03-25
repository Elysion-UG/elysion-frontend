"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
}

async function call(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, {
    method, headers, credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } }
  catch { return { status: res.status, data: text } }
}

function EndpointCard({ method, path, auth, description, children, onExecute }: {
  method: string; path: string; auth: string; description: string
  children?: React.ReactNode; onExecute: () => Promise<unknown>
}) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<unknown>(null)
  const execute = async () => {
    setLoading(true)
    try { const r = await onExecute(); setResponse(r); toast.success("OK") }
    catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); setResponse({ error: m }); toast.error(m) }
    finally { setLoading(false) }
  }
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-mono">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[method] ?? "bg-gray-100"}`}>{method}</span>
          <span className="text-slate-700">{path}</span>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{auth}</span>
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        <Button size="sm" onClick={execute} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
          {loading && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Execute
        </Button>
        {response !== null && (
          <pre className="mt-2 p-3 bg-slate-50 border rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default function DevCategoriesPage() {
  const [token, setToken] = useState("")
  const [createName, setCreateName] = useState("")
  const [createSlug, setCreateSlug] = useState("")
  const [createParentId, setCreateParentId] = useState("")
  const [createDesc, setCreateDesc] = useState("")
  const [createOrder, setCreateOrder] = useState("0")
  const [updateId, setUpdateId] = useState("")
  const [updateName, setUpdateName] = useState("")
  const [updateSlug, setUpdateSlug] = useState("")
  const [updateActive, setUpdateActive] = useState(true)
  const [toggleId, setToggleId] = useState("")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Categories API Test</h1>
        <p className="text-sm text-slate-500 mb-6">Kategorie-Endpunkte (Public + Admin)</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Admin Bearer Token</CardTitle></CardHeader>
          <CardContent>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGci... (ADMIN-Token für Schreib-Endpunkte)" className="font-mono text-xs bg-white" />
          </CardContent>
        </Card>

        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Öffentliche Endpunkte</h2>

        <EndpointCard method="GET" path="/api/v1/categories" auth="PUBLIC"
          description="Alle aktiven Kategorien als flache Liste"
          onExecute={() => call("GET", "/api/v1/categories")} />

        <EndpointCard method="GET" path="/api/v1/categories/tree" auth="PUBLIC"
          description="Kategorie-Hierarchie als Baum (3 Ebenen)"
          onExecute={() => call("GET", "/api/v1/categories/tree")} />

        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 mt-6">Admin-Endpunkte (ADMIN Token erforderlich)</h2>

        <EndpointCard method="POST" path="/api/v1/categories" auth="ADMIN"
          description="Neue Kategorie erstellen"
          onExecute={() => call("POST", "/api/v1/categories", {
            name: createName, slug: createSlug,
            ...(createParentId ? { parentId: createParentId } : {}),
            ...(createDesc ? { description: createDesc } : {}),
            order: parseInt(createOrder) || 0,
          }, token)}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Name</Label><Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Elektronik" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Slug</Label><Input value={createSlug} onChange={e => setCreateSlug(e.target.value)} placeholder="elektronik" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Parent ID (optional)</Label><Input value={createParentId} onChange={e => setCreateParentId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Reihenfolge</Label><Input type="number" value={createOrder} onChange={e => setCreateOrder(e.target.value)} className="h-8 text-xs" /></div>
            <div className="col-span-2"><Label className="text-xs">Beschreibung (optional)</Label><Input value={createDesc} onChange={e => setCreateDesc(e.target.value)} className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        <EndpointCard method="PATCH" path="/api/v1/categories/{id}" auth="ADMIN"
          description="Kategorie aktualisieren"
          onExecute={() => call("PATCH", `/api/v1/categories/${updateId}`, {
            ...(updateName ? { name: updateName } : {}),
            ...(updateSlug ? { slug: updateSlug } : {}),
            isActive: updateActive,
          }, token)}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Kategorie-ID (UUID)</Label><Input value={updateId} onChange={e => setUpdateId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div className="flex items-end gap-2">
              <Checkbox checked={updateActive} onCheckedChange={v => setUpdateActive(!!v)} />
              <Label className="text-xs">Aktiv</Label>
            </div>
            <div><Label className="text-xs">Neuer Name (optional)</Label><Input value={updateName} onChange={e => setUpdateName(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Neuer Slug (optional)</Label><Input value={updateSlug} onChange={e => setUpdateSlug(e.target.value)} className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        <EndpointCard method="PATCH" path="/api/v1/categories/{id}/deactivate" auth="ADMIN"
          description="Kategorie deaktivieren"
          onExecute={() => call("PATCH", `/api/v1/categories/${toggleId}/deactivate`, {}, token)}
        >
          <div><Label className="text-xs">Kategorie-ID</Label><Input value={toggleId} onChange={e => setToggleId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
        </EndpointCard>

        <EndpointCard method="PATCH" path="/api/v1/categories/{id}/activate" auth="ADMIN"
          description="Kategorie aktivieren"
          onExecute={() => call("PATCH", `/api/v1/categories/${toggleId}/activate`, {}, token)}
        >
          <p className="text-xs text-slate-500">Verwendet dieselbe ID wie oben</p>
        </EndpointCard>
      </div>
    </div>
  )
}
