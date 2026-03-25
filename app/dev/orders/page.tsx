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
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const MC: Record<string, string> = { GET: "bg-blue-100 text-blue-800", POST: "bg-green-100 text-green-800", PATCH: "bg-yellow-100 text-yellow-800" }

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

export default function DevOrdersPage() {
  const [token, setToken] = useState("")

  // Buyer
  const [buyerOrderId, setBuyerOrderId] = useState("")

  // Seller order groups
  const [sellerOrderGroupId, setSellerOrderGroupId] = useState("")
  const [orderStatus, setOrderStatus] = useState("PROCESSING")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Orders API Test</h1>
        <p className="text-sm text-slate-500 mb-6">Käufer-Bestellungen, Seller-OrderGroups, Versand, Auszahlungen</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bearer Token</CardTitle></CardHeader>
          <CardContent>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGci..." className="font-mono text-xs bg-white" />
          </CardContent>
        </Card>

        <Tabs defaultValue="buyer">
          <TabsList className="mb-4">
            <TabsTrigger value="buyer">Käufer</TabsTrigger>
            <TabsTrigger value="seller">Seller</TabsTrigger>
            <TabsTrigger value="settlements">Auszahlungen</TabsTrigger>
          </TabsList>

          <TabsContent value="buyer">
            <EC method="GET" path="/api/v1/orders" auth="BUYER" description="Alle eigenen Bestellungen abrufen"
              onExecute={() => call("GET", "/api/v1/orders", undefined, token)} />

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Order-ID</Label>
                <Input value={buyerOrderId} onChange={e => setBuyerOrderId(e.target.value)} placeholder="UUID der Bestellung" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>

            <EC method="GET" path="/api/v1/orders/{id}" auth="BUYER" description="Einzelne Bestellung abrufen"
              onExecute={() => call("GET", `/api/v1/orders/${buyerOrderId}`, undefined, token)} />
          </TabsContent>

          <TabsContent value="seller">
            <EC method="GET" path="/api/v1/seller/orders" auth="SELLER" description="Alle Seller-Bestellgruppen abrufen"
              onExecute={() => call("GET", "/api/v1/seller/orders", undefined, token)} />

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">OrderGroup-ID (für alle folgenden Endpunkte)</Label>
                <Input value={sellerOrderGroupId} onChange={e => setSellerOrderGroupId(e.target.value)} placeholder="UUID der OrderGroup" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>

            <EC method="GET" path="/api/v1/seller/orders/{id}" auth="SELLER" description="Einzelne Bestellgruppe abrufen"
              onExecute={() => call("GET", `/api/v1/seller/orders/${sellerOrderGroupId}`, undefined, token)} />

            <EC method="PATCH" path="/api/v1/seller/orders/{id}/status" auth="SELLER" description="Status der Bestellgruppe aktualisieren"
              onExecute={() => call("PATCH", `/api/v1/seller/orders/${sellerOrderGroupId}/status`, { status: orderStatus }, token)}>
              <div>
                <Label className="text-xs">Neuer Status</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map(s =>
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </EC>

            <EC method="POST" path="/api/v1/seller/orders/{id}/ship" auth="SELLER" description="Bestellung als versendet markieren"
              onExecute={() => call("POST", `/api/v1/seller/orders/${sellerOrderGroupId}/ship`, {
                ...(trackingNumber ? { trackingNumber } : {}),
                ...(carrier ? { carrier } : {}),
              }, token)}>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Tracking-Nummer (optional)</Label><Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="1Z999AA10123456784" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Carrier (optional)</Label><Input value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="DHL, UPS, ..." className="h-8 text-xs" /></div>
              </div>
            </EC>

            <EC method="POST" path="/api/v1/seller/orders/{id}/deliver" auth="SELLER" description="Bestellung als zugestellt markieren"
              onExecute={() => call("POST", `/api/v1/seller/orders/${sellerOrderGroupId}/deliver`, {}, token)} />
          </TabsContent>

          <TabsContent value="settlements">
            <EC method="GET" path="/api/v1/seller/settlements" auth="SELLER" description="Eigene Auszahlungen abrufen"
              onExecute={() => call("GET", "/api/v1/seller/settlements", undefined, token)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
