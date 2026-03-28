"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const MC: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
}

async function call(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text) }
  } catch {
    return { status: res.status, data: text }
  }
}

function EC({
  method,
  path,
  auth,
  description,
  children,
  onExecute,
}: {
  method: string
  path: string
  auth: string
  description: string
  children?: React.ReactNode
  onExecute: () => Promise<unknown>
}) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<unknown>(null)
  const execute = async () => {
    setLoading(true)
    try {
      setResponse(await onExecute())
      toast.success("OK")
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
        <CardTitle className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${MC[method] ?? "bg-gray-100"}`}>
            {method}
          </span>
          <span className="text-slate-700">{path}</span>
          <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
            {auth}
          </span>
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        <Button
          size="sm"
          onClick={execute}
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Execute
        </Button>
        {response !== null && (
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded border bg-slate-50 p-3 text-xs">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default function DevAdminUsersPage() {
  const [token, setToken] = useState("")

  // Users list
  const [usersPage, setUsersPage] = useState("0")
  const [usersSize, setUsersSize] = useState("20")
  const [usersSearch, setUsersSearch] = useState("")
  const [usersRole, setUsersRole] = useState("")

  // User detail
  const [userId, setUserId] = useState("")
  const [suspendReason, setSuspendReason] = useState("")

  // Sellers list
  const [sellersStatus, setSellersStatus] = useState("")
  const [sellersPage, setSellersPage] = useState("0")

  // Seller detail
  const [sellerId, setSellerId] = useState("")
  const [rejectReason, setRejectReason] = useState("")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/dev"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Admin: Users & Sellers API Test</h1>
        <p className="mb-6 text-sm text-slate-500">
          Dashboard, Benutzer- und Verkäufer-Moderation, Genehmigungen
        </p>

        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-800">Admin Bearer Token erforderlich</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGci... (ADMIN)"
              className="bg-white font-mono text-xs"
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Benutzer</TabsTrigger>
            <TabsTrigger value="sellers">Seller</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <EC
              method="GET"
              path="/api/v1/admin/dashboard"
              auth="ADMIN"
              description="Admin-Dashboard Statistiken abrufen"
              onExecute={() => call("GET", "/api/v1/admin/dashboard", undefined, token)}
            />
          </TabsContent>

          <TabsContent value="users">
            <EC
              method="GET"
              path="/api/v1/admin/users"
              auth="ADMIN"
              description="Alle Benutzer auflisten (paginiert, filterbar)"
              onExecute={() => {
                const params = new URLSearchParams({ page: usersPage, size: usersSize })
                if (usersSearch) params.set("search", usersSearch)
                if (usersRole) params.set("role", usersRole)
                return call("GET", `/api/v1/admin/users?${params}`, undefined, token)
              }}
            >
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Seite</Label>
                  <Input
                    type="number"
                    value={usersPage}
                    onChange={(e) => setUsersPage(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Größe</Label>
                  <Input
                    type="number"
                    value={usersSize}
                    onChange={(e) => setUsersSize(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Rolle (optional)</Label>
                  <Select value={usersRole} onValueChange={setUsersRole}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">alle</SelectItem>
                      <SelectItem value="BUYER">BUYER</SelectItem>
                      <SelectItem value="SELLER">SELLER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Suche (optional)</Label>
                  <Input
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    placeholder="Email oder Name"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </EC>

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">
                  User-ID (für alle folgenden Endpunkte)
                </Label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="UUID des Benutzers"
                  className="mt-1 h-8 text-xs"
                />
              </CardContent>
            </Card>

            <EC
              method="GET"
              path="/api/v1/admin/users/{id}"
              auth="ADMIN"
              description="Benutzerdetails abrufen"
              onExecute={() => call("GET", `/api/v1/admin/users/${userId}`, undefined, token)}
            />

            <EC
              method="PATCH"
              path="/api/v1/admin/users/{id}/suspend"
              auth="ADMIN"
              description="Benutzer sperren"
              onExecute={() =>
                call(
                  "PATCH",
                  `/api/v1/admin/users/${userId}/suspend`,
                  { reason: suspendReason },
                  token
                )
              }
            >
              <div>
                <Label className="text-xs">Grund</Label>
                <Input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Sperr-Begründung"
                  className="h-8 text-xs"
                />
              </div>
            </EC>

            <EC
              method="PATCH"
              path="/api/v1/admin/users/{id}/unsuspend"
              auth="ADMIN"
              description="Benutzer-Sperre aufheben"
              onExecute={() => call("PATCH", `/api/v1/admin/users/${userId}/unsuspend`, {}, token)}
            />

            <EC
              method="PATCH"
              path="/api/v1/admin/users/{id}/activate"
              auth="ADMIN"
              description="Benutzer manuell aktivieren"
              onExecute={() => call("PATCH", `/api/v1/admin/users/${userId}/activate`, {}, token)}
            />

            <EC
              method="DELETE"
              path="/api/v1/admin/users/{id}"
              auth="ADMIN"
              description="Benutzer löschen (Hard Delete)"
              onExecute={() => call("DELETE", `/api/v1/admin/users/${userId}`, undefined, token)}
            />
          </TabsContent>

          <TabsContent value="sellers">
            <EC
              method="GET"
              path="/api/v1/admin/sellers"
              auth="ADMIN"
              description="Seller-Accounts auflisten"
              onExecute={() => {
                const params = new URLSearchParams({ page: sellersPage, size: "20" })
                if (sellersStatus) params.set("status", sellersStatus)
                return call("GET", `/api/v1/admin/sellers?${params}`, undefined, token)
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Status (optional)</Label>
                  <Select value={sellersStatus} onValueChange={setSellersStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">alle</SelectItem>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="APPROVED">APPROVED</SelectItem>
                      <SelectItem value="REJECTED">REJECTED</SelectItem>
                      <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Seite</Label>
                  <Input
                    type="number"
                    value={sellersPage}
                    onChange={(e) => setSellersPage(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </EC>

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">
                  Seller-ID (für alle folgenden Endpunkte)
                </Label>
                <Input
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  placeholder="UUID des Sellers"
                  className="mt-1 h-8 text-xs"
                />
              </CardContent>
            </Card>

            <EC
              method="GET"
              path="/api/v1/admin/sellers/{id}"
              auth="ADMIN"
              description="Seller-Details abrufen"
              onExecute={() => call("GET", `/api/v1/admin/sellers/${sellerId}`, undefined, token)}
            />

            <EC
              method="PATCH"
              path="/api/v1/admin/sellers/{id}/approve"
              auth="ADMIN"
              description="Seller-Account genehmigen"
              onExecute={() =>
                call("PATCH", `/api/v1/admin/sellers/${sellerId}/approve`, {}, token)
              }
            />

            <EC
              method="PATCH"
              path="/api/v1/admin/sellers/{id}/reject"
              auth="ADMIN"
              description="Seller-Account ablehnen"
              onExecute={() =>
                call(
                  "PATCH",
                  `/api/v1/admin/sellers/${sellerId}/reject`,
                  { reason: rejectReason },
                  token
                )
              }
            >
              <div>
                <Label className="text-xs">Ablehnungsgrund</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="h-16 text-xs"
                />
              </div>
            </EC>

            <EC
              method="PATCH"
              path="/api/v1/admin/sellers/{id}/suspend"
              auth="ADMIN"
              description="Seller sperren"
              onExecute={() =>
                call(
                  "PATCH",
                  `/api/v1/admin/sellers/${sellerId}/suspend`,
                  { reason: suspendReason },
                  token
                )
              }
            >
              <div>
                <Label className="text-xs">Sperr-Grund</Label>
                <Input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </EC>

            <EC
              method="PATCH"
              path="/api/v1/admin/sellers/{id}/unsuspend"
              auth="ADMIN"
              description="Seller-Sperre aufheben"
              onExecute={() =>
                call("PATCH", `/api/v1/admin/sellers/${sellerId}/unsuspend`, {}, token)
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
