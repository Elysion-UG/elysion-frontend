"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function DevCartPage() {
  const [token, setToken] = useState("")

  // Cart items
  const [addProductId, setAddProductId] = useState("")
  const [addVariantId, setAddVariantId] = useState("")
  const [addQty, setAddQty] = useState("1")
  const [itemId, setItemId] = useState("")
  const [updateQty, setUpdateQty] = useState("1")

  // Checkout
  const [shippingAddrId, setShippingAddrId] = useState("")
  const [billingAddrId, setBillingAddrId] = useState("")
  const [checkoutJson, setCheckoutJson] = useState("{}")

  // Complete checkout
  const [orderId, setOrderId] = useState("")
  const [paymentIntentId, setPaymentIntentId] = useState("")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Cart & Checkout API Test</h1>
        <p className="text-sm text-slate-500 mb-6">Warenkorb (Gast & Auth), Checkout</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bearer Token (optional — Gast-Cart funktioniert via Cookie)</CardTitle></CardHeader>
          <CardContent>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGci... (leer lassen für Gast-Cart)" className="font-mono text-xs bg-white" />
          </CardContent>
        </Card>

        <Tabs defaultValue="cart">
          <TabsList className="mb-4">
            <TabsTrigger value="cart">Warenkorb</TabsTrigger>
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
          </TabsList>

          <TabsContent value="cart">
            <EC method="GET" path="/api/v1/cart" auth="PUBLIC / AUTH" description="Aktuellen Warenkorb abrufen (Gast via Cookie, Auth via Token)"
              onExecute={() => call("GET", "/api/v1/cart", undefined, token || undefined)} />

            <EC method="POST" path="/api/v1/cart/items" auth="PUBLIC / AUTH" description="Artikel zum Warenkorb hinzufügen"
              onExecute={() => call("POST", "/api/v1/cart/items", {
                productId: addProductId,
                ...(addVariantId ? { variantId: addVariantId } : {}),
                quantity: parseInt(addQty) || 1,
              }, token || undefined)}>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Produkt-ID</Label><Input value={addProductId} onChange={e => setAddProductId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Varianten-ID (optional)</Label><Input value={addVariantId} onChange={e => setAddVariantId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Menge</Label><Input type="number" min="1" value={addQty} onChange={e => setAddQty(e.target.value)} className="h-8 text-xs" /></div>
              </div>
            </EC>

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Cart-Item-ID (für PATCH / DELETE)</Label>
                <Input value={itemId} onChange={e => setItemId(e.target.value)} placeholder="UUID des Cart-Items" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>

            <EC method="PATCH" path="/api/v1/cart/items/{id}" auth="PUBLIC / AUTH" description="Menge eines Cart-Items ändern"
              onExecute={() => call("PATCH", `/api/v1/cart/items/${itemId}`, { quantity: parseInt(updateQty) || 1 }, token || undefined)}>
              <div><Label className="text-xs">Neue Menge</Label><Input type="number" min="1" value={updateQty} onChange={e => setUpdateQty(e.target.value)} className="h-8 text-xs" /></div>
            </EC>

            <EC method="DELETE" path="/api/v1/cart/items/{id}" auth="PUBLIC / AUTH" description="Artikel aus Warenkorb entfernen"
              onExecute={() => call("DELETE", `/api/v1/cart/items/${itemId}`, undefined, token || undefined)} />
          </TabsContent>

          <TabsContent value="checkout">
            <p className="text-xs text-slate-500 mb-4">Checkout erfordert einen eingeloggten BUYER mit Adressen im Konto.</p>

            <EC method="POST" path="/api/v1/checkout" auth="BUYER" description="Bestellung aufgeben (Checkout starten)"
              onExecute={() => {
                let extra = {}
                try { extra = JSON.parse(checkoutJson) } catch { /* ignore */ }
                return call("POST", "/api/v1/checkout", {
                  ...(shippingAddrId ? { shippingAddressId: shippingAddrId } : {}),
                  ...(billingAddrId ? { billingAddressId: billingAddrId } : {}),
                  ...extra,
                }, token)
              }}>
              <div className="space-y-2">
                <div><Label className="text-xs">Lieferadresse-ID</Label><Input value={shippingAddrId} onChange={e => setShippingAddrId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Rechnungsadresse-ID (optional)</Label><Input value={billingAddrId} onChange={e => setBillingAddrId(e.target.value)} placeholder="UUID (=Lieferadresse wenn leer)" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Zusätzliche Felder (JSON)</Label><Textarea value={checkoutJson} onChange={e => setCheckoutJson(e.target.value)} className="text-xs h-16" /></div>
              </div>
            </EC>

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Order-ID</Label>
                  <Input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="UUID der Bestellung" className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Payment-Intent-ID</Label>
                  <Input value={paymentIntentId} onChange={e => setPaymentIntentId(e.target.value)} placeholder="pi_..." className="h-8 text-xs mt-1" />
                </div>
              </CardContent>
            </Card>

            <EC method="POST" path="/api/v1/checkout/complete" auth="BUYER" description="Checkout abschließen nach Zahlung"
              onExecute={() => call("POST", "/api/v1/checkout/complete", {
                orderId,
                paymentIntentId,
              }, token)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
