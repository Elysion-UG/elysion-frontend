"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    try {
      const r = await onExecute()
      setResponse(r)
      toast.success("Request sent")
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      setResponse({ error: m })
      toast.error(m)
    } finally {
      setLoading(false)
    }
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
          <pre className="mt-3 p-3 bg-slate-50 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default function DevCategoriesPage() {
  const [token, setToken] = useState("")

  // Create
  const [createName, setCreateName] = useState("")
  const [createSlug, setCreateSlug] = useState("")
  const [createParentId, setCreateParentId] = useState("")
  const [createDesc, setCreateDesc] = useState("")

  // Update
  const [updateId, setUpdateId] = useState("")
  const [updateName, setUpdateName] = useState("")
  const [updateSlug, setUpdateSlug] = useState("")
  const [updateDesc, setUpdateDesc] = useState("")

  // Deactivate / Activate (separate IDs)
  const [deactivateId, setDeactivateId] = useState("")
  const [activateId, setActivateId] = useState("")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dev Index
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Categories Endpoints</h1>
        <p className="text-sm text-slate-500 mb-6">6 endpoints — category management</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bearer Token (for admin endpoints)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="eyJhbGci... (paste admin token)"
              className="font-mono text-xs bg-white"
            />
          </CardContent>
        </Card>

        {/* ── Public Endpoints ────────────────────────────────────────────── */}
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Public</h2>

        <EndpointCard
          method="GET" path="/api/v1/categories" auth="PUBLIC"
          description="List all categories as a flat array with id, name, slug, parentId, and isActive."
          onExecute={() => call("GET", "/api/v1/categories")}
        />

        <EndpointCard
          method="GET" path="/api/v1/categories/tree" auth="PUBLIC"
          description="Get category hierarchy as a nested tree structure."
          onExecute={() => call("GET", "/api/v1/categories/tree")}
        />

        {/* ── Admin Endpoints ──────────────────────────────────────────────── */}
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-6 mb-3">Admin</h2>

        <EndpointCard
          method="POST" path="/api/v1/admin/categories" auth="ADMIN"
          description="Create a new category. name and slug are required; parentId and description are optional."
          onExecute={() => {
            const body: Record<string, string> = { name: createName, slug: createSlug }
            if (createParentId) body.parentId = createParentId
            if (createDesc) body.description = createDesc
            return call("POST", "/api/v1/admin/categories", body, token)
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Electronics" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Slug *</Label>
              <Input value={createSlug} onChange={e => setCreateSlug(e.target.value)} placeholder="electronics" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Parent ID (optional)</Label>
              <Input value={createParentId} onChange={e => setCreateParentId(e.target.value)} placeholder="uuid of parent" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Description (optional)</Label>
              <Input value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="Category description" className="h-8 text-xs" />
            </div>
          </div>
        </EndpointCard>

        <EndpointCard
          method="PATCH" path="/api/v1/admin/categories/{id}" auth="ADMIN"
          description="Update an existing category. All body fields are optional."
          onExecute={() => {
            const body: Record<string, string> = {}
            if (updateName) body.name = updateName
            if (updateSlug) body.slug = updateSlug
            if (updateDesc) body.description = updateDesc
            return call("PATCH", `/api/v1/admin/categories/${updateId}`, body, token)
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Category ID *</Label>
              <Input value={updateId} onChange={e => setUpdateId(e.target.value)} placeholder="uuid" className="h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-xs">Name (optional)</Label>
              <Input value={updateName} onChange={e => setUpdateName(e.target.value)} placeholder="New name" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Slug (optional)</Label>
              <Input value={updateSlug} onChange={e => setUpdateSlug(e.target.value)} placeholder="new-slug" className="h-8 text-xs" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Description (optional)</Label>
              <Input value={updateDesc} onChange={e => setUpdateDesc(e.target.value)} placeholder="Updated description" className="h-8 text-xs" />
            </div>
          </div>
        </EndpointCard>

        <EndpointCard
          method="PATCH" path="/api/v1/admin/categories/{id}/deactivate" auth="ADMIN"
          description="Deactivate a category by ID. No request body required."
          onExecute={() => call("PATCH", `/api/v1/admin/categories/${deactivateId}/deactivate`, undefined, token)}
        >
          <div>
            <Label className="text-xs">Category ID *</Label>
            <Input value={deactivateId} onChange={e => setDeactivateId(e.target.value)} placeholder="uuid" className="h-8 text-xs font-mono" />
          </div>
        </EndpointCard>

        <EndpointCard
          method="PATCH" path="/api/v1/admin/categories/{id}/activate" auth="ADMIN"
          description="Activate a category by ID. No request body required."
          onExecute={() => call("PATCH", `/api/v1/admin/categories/${activateId}/activate`, undefined, token)}
        >
          <div>
            <Label className="text-xs">Category ID *</Label>
            <Input value={activateId} onChange={e => setActivateId(e.target.value)} placeholder="uuid" className="h-8 text-xs font-mono" />
          </div>
        </EndpointCard>
      </div>
    </div>
  )
}
