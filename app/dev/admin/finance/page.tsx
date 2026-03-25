"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const MC: Record<string, string> = { GET: "bg-blue-100 text-blue-800", POST: "bg-green-100 text-green-800", PATCH: "bg-yellow-100 text-yellow-800", DELETE: "bg-red-100 text-red-800" }

async function call(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { method, headers, credentials: "include", body: body !== undefined ? JSON.stringify(body) : undefined })
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } } catch { return { status: res.status, data: text } }
}

function EC({ method, path, auth, description, children, onExecute }: { method: string; path: string; auth: string; description: string; children?: React.ReactNode; onExecute: () => Promise<unknown> }) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<unknown>(null)
  const execute = async () => {
    setLoading(true)
    try { setResponse(await onExecute()); toast.success("OK") }
    catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); setResponse({ error: m }); toast.error(m) }
    finally { setLoading(false) }
  }
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-mono">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${MC[method] ?? "bg-gray-100"}`}>{method}</span>
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
        {response !== null && <pre className="mt-2 p-3 bg-slate-50 border rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>}
      </CardContent>
    </Card>
  )
}

export default function DevAdminFinancePage() {
  const [token, setToken] = useState("")

  // Products
  const [adminProductId, setAdminProductId] = useState("")
  const [adminProductStatus, setAdminProductStatus] = useState("ACTIVE")

  // Certificates
  const [adminCertId, setAdminCertId] = useState("")
  const [certRejectReason, setCertRejectReason] = useState("")

  // Orders
  const [adminOrderId, setAdminOrderId] = useState("")
  const [adminOrderStatus, setAdminOrderStatus] = useState("PROCESSING")

  // Finance
  const [adminPaymentId, setAdminPaymentId] = useState("")
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [settlementId, setSettlementId] = useState("")
  const [payoutSellerId, setPayoutSellerId] = useState("")
  const [payoutAmount, setPayoutAmount] = useState("")

  // Maintenance
  const [cleanupDays, setCleanupDays] = useState("30")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Admin: Finance & Maintenance API Test</h1>
        <p className="text-sm text-slate-500 mb-6">Produkte, Zertifikate, Bestellungen, Zahlungen, Wartungs-Jobs</p>

        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-red-800">Admin Bearer Token erforderlich</CardTitle></CardHeader>
          <CardContent>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGci... (ADMIN)" className="font-mono text-xs bg-white" />
          </CardContent>
        </Card>

        <Tabs defaultValue="products">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="products">Produkte</TabsTrigger>
            <TabsTrigger value="certificates">Zertifikate</TabsTrigger>
            <TabsTrigger value="orders">Bestellungen</TabsTrigger>
            <TabsTrigger value="finance">Finanzen</TabsTrigger>
            <TabsTrigger value="maintenance">Wartung</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <EC method="GET" path="/api/v1/admin/products" auth="ADMIN" description="Alle Produkte auflisten (Admin-Sicht, inkl. DRAFT/REVIEW)"
              onExecute={() => call("GET", "/api/v1/admin/products", undefined, token)} />

            <EC method="GET" path="/api/v1/admin/products/review" auth="ADMIN" description="Produkte im REVIEW-Status abrufen"
              onExecute={() => call("GET", "/api/v1/admin/products/review", undefined, token)} />

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Produkt-ID (für Status-Änderung)</Label>
                <Input value={adminProductId} onChange={e => setAdminProductId(e.target.value)} placeholder="UUID des Produkts" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>

            <EC method="PATCH" path="/api/v1/admin/products/{id}/status" auth="ADMIN" description="Produkt-Status setzen (z.B. REJECTED)"
              onExecute={() => call("PATCH", `/api/v1/admin/products/${adminProductId}/status`, { status: adminProductStatus }, token)}>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={adminProductStatus} onValueChange={setAdminProductStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["ACTIVE", "INACTIVE", "REJECTED", "REVIEW"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </EC>

            <EC method="DELETE" path="/api/v1/admin/products/{id}" auth="ADMIN" description="Produkt löschen (Admin)"
              onExecute={() => call("DELETE", `/api/v1/admin/products/${adminProductId}`, undefined, token)} />
          </TabsContent>

          <TabsContent value="certificates">
            <EC method="GET" path="/api/v1/admin/certificates" auth="ADMIN" description="Alle Zertifikate auflisten (Admin)"
              onExecute={() => call("GET", "/api/v1/admin/certificates", undefined, token)} />

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Zertifikat-ID</Label>
                <Input value={adminCertId} onChange={e => setAdminCertId(e.target.value)} placeholder="UUID des Zertifikats" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>

            <EC method="PATCH" path="/api/v1/admin/certificates/{id}/verify" auth="ADMIN" description="Zertifikat verifizieren / genehmigen"
              onExecute={() => call("PATCH", `/api/v1/admin/certificates/${adminCertId}/verify`, {}, token)} />

            <EC method="PATCH" path="/api/v1/admin/certificates/{id}/reject" auth="ADMIN" description="Zertifikat ablehnen"
              onExecute={() => call("PATCH", `/api/v1/admin/certificates/${adminCertId}/reject`, { reason: certRejectReason }, token)}>
              <div><Label className="text-xs">Ablehnungsgrund</Label><Textarea value={certRejectReason} onChange={e => setCertRejectReason(e.target.value)} className="text-xs h-16" /></div>
            </EC>
          </TabsContent>

          <TabsContent value="orders">
            <EC method="GET" path="/api/v1/admin/orders" auth="ADMIN" description="Alle Bestellungen auflisten (Admin)"
              onExecute={() => call("GET", "/api/v1/admin/orders", undefined, token)} />

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Order-ID</Label>
                <Input value={adminOrderId} onChange={e => setAdminOrderId(e.target.value)} placeholder="UUID der Bestellung" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>

            <EC method="PATCH" path="/api/v1/admin/orders/{id}/status" auth="ADMIN" description="Bestell-Status überschreiben (Admin)"
              onExecute={() => call("PATCH", `/api/v1/admin/orders/${adminOrderId}/status`, { status: adminOrderStatus }, token)}>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={adminOrderStatus} onValueChange={setAdminOrderStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </EC>
          </TabsContent>

          <TabsContent value="finance">
            <EC method="GET" path="/api/v1/admin/payments" auth="ADMIN" description="Alle Zahlungen auflisten"
              onExecute={() => call("GET", "/api/v1/admin/payments", undefined, token)} />

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Payment-ID (für Refund)</Label>
                <Input value={adminPaymentId} onChange={e => setAdminPaymentId(e.target.value)} placeholder="UUID des Payments" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>

            <EC method="POST" path="/api/v1/admin/payments/{id}/refund" auth="ADMIN" description="Rückerstattung auslösen"
              onExecute={() => call("POST", `/api/v1/admin/payments/${adminPaymentId}/refund`, {
                ...(refundAmount ? { amount: Math.round(parseFloat(refundAmount) * 100) } : {}),
                ...(refundReason ? { reason: refundReason } : {}),
              }, token)}>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Betrag EUR (leer = komplett)</Label><Input type="number" step="0.01" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="29.99" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Grund</Label><Input value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Defekt, ..." className="h-8 text-xs" /></div>
              </div>
            </EC>

            <EC method="GET" path="/api/v1/admin/settlements" auth="ADMIN" description="Alle Auszahlungen auflisten"
              onExecute={() => call("GET", "/api/v1/admin/settlements", undefined, token)} />

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Settlement-ID (für manuelle Auszahlung)</Label>
                <Input value={settlementId} onChange={e => setSettlementId(e.target.value)} placeholder="UUID" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>

            <EC method="POST" path="/api/v1/admin/settlements/{id}/payout" auth="ADMIN" description="Manuelle Auszahlung anstoßen"
              onExecute={() => call("POST", `/api/v1/admin/settlements/${settlementId}/payout`, {}, token)} />

            <h3 className="text-sm font-semibold text-slate-600 mt-4 mb-2">Seller-Auszahlung</h3>
            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4 grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Seller-ID</Label><Input value={payoutSellerId} onChange={e => setPayoutSellerId(e.target.value)} placeholder="UUID" className="h-8 text-xs mt-1" /></div>
                <div><Label className="text-xs">Betrag EUR</Label><Input type="number" step="0.01" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="150.00" className="h-8 text-xs mt-1" /></div>
              </CardContent>
            </Card>

            <EC method="POST" path="/api/v1/admin/sellers/{id}/payout" auth="ADMIN" description="Seller-Auszahlung manuell auslösen"
              onExecute={() => call("POST", `/api/v1/admin/sellers/${payoutSellerId}/payout`, {
                ...(payoutAmount ? { amount: Math.round(parseFloat(payoutAmount) * 100) } : {}),
              }, token)} />
          </TabsContent>

          <TabsContent value="maintenance">
            <p className="text-xs text-slate-500 mb-4">Wartungs-Jobs manuell anstoßen. Normalerweise laufen diese automatisch via Scheduler.</p>

            <EC method="POST" path="/api/v1/admin/maintenance/cleanup-sessions" auth="ADMIN" description="Abgelaufene Sessions bereinigen"
              onExecute={() => call("POST", "/api/v1/admin/maintenance/cleanup-sessions", { olderThanDays: parseInt(cleanupDays) || 30 }, token)}>
              <div><Label className="text-xs">Älter als (Tage)</Label><Input type="number" value={cleanupDays} onChange={e => setCleanupDays(e.target.value)} className="h-8 text-xs" /></div>
            </EC>

            <EC method="POST" path="/api/v1/admin/maintenance/expire-certificates" auth="ADMIN" description="Abgelaufene Zertifikate deaktivieren"
              onExecute={() => call("POST", "/api/v1/admin/maintenance/expire-certificates", {}, token)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
