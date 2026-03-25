"use client"

import { useState } from "react"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { apiRequest, setAccessToken } from "@/src/lib/api-client"

const MC: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
}

function EndpointCard({
  method,
  path,
  description,
  children,
  onExecute,
}: {
  method: string
  path: string
  description: string
  children?: React.ReactNode
  onExecute: () => Promise<unknown>
}) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  const execute = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const result = await onExecute()
      setResponse(result)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-mono">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${MC[method] ?? "bg-gray-100"}`}>{method}</span>
          <span className="text-slate-700">{path}</span>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">AUTH</span>
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        <Button size="sm" onClick={execute} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
          {loading && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Execute
        </Button>
        {error !== null && (
          <pre className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap text-red-700">
            {error}
          </pre>
        )}
        {response !== null && (
          <pre className="mt-2 p-3 bg-slate-50 border rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-semibold text-slate-700 mt-8 mb-3 pb-1 border-b border-slate-200">{title}</h2>
  )
}

export default function DevCartPage() {
  const [token, setToken] = useState("")

  // Cart state
  const [addProductId, setAddProductId] = useState("")
  const [addVariantId, setAddVariantId] = useState("")
  const [addQty, setAddQty] = useState("1")
  const [itemId, setItemId] = useState("")
  const [updateQty, setUpdateQty] = useState("1")
  const [deleteItemId, setDeleteItemId] = useState("")

  // Checkout state
  const [shippingAddrId, setShippingAddrId] = useState("")
  const [billingAddrId, setBillingAddrId] = useState("")
  const [checkoutNotes, setCheckoutNotes] = useState("")
  const [checkoutId, setCheckoutId] = useState("")
  const [paymentIntentId, setPaymentIntentId] = useState("")

  function withToken<T>(fn: () => Promise<T>): Promise<T> {
    const prev = token
    if (prev) setAccessToken(prev)
    return fn()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dev Index
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Cart &amp; Checkout Endpoints</h1>
        <p className="text-sm text-slate-500 mb-6">All endpoints require authentication (AUTH).</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bearer Token</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGci..."
              className="font-mono text-xs bg-white"
            />
          </CardContent>
        </Card>

        <SectionHeader title="Cart" />

        <EndpointCard
          method="GET"
          path="/api/v1/cart"
          description="Get current cart. Returns items array with id, productId, variantId, quantity, price, and total."
          onExecute={() =>
            withToken(() =>
              apiRequest("/api/v1/cart")
            )
          }
        />

        <EndpointCard
          method="POST"
          path="/api/v1/cart/items"
          description="Add item to cart."
          onExecute={() =>
            withToken(() =>
              apiRequest("/api/v1/cart/items", {
                method: "POST",
                body: JSON.stringify({
                  productId: addProductId,
                  ...(addVariantId ? { variantId: addVariantId } : {}),
                  quantity: parseInt(addQty) || 1,
                }),
              })
            )
          }
        >
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">productId</Label>
              <Input
                value={addProductId}
                onChange={(e) => setAddProductId(e.target.value)}
                placeholder="UUID"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">variantId (optional)</Label>
              <Input
                value={addVariantId}
                onChange={(e) => setAddVariantId(e.target.value)}
                placeholder="UUID"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">quantity</Label>
              <Input
                type="number"
                min="1"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EndpointCard>

        <EndpointCard
          method="PATCH"
          path="/api/v1/cart/items/{id}"
          description="Update cart item quantity."
          onExecute={() =>
            withToken(() =>
              apiRequest(`/api/v1/cart/items/${itemId}`, {
                method: "PATCH",
                body: JSON.stringify({ quantity: parseInt(updateQty) || 1 }),
              })
            )
          }
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">id (cart item id)</Label>
              <Input
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                placeholder="UUID"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">quantity</Label>
              <Input
                type="number"
                min="1"
                value={updateQty}
                onChange={(e) => setUpdateQty(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EndpointCard>

        <EndpointCard
          method="DELETE"
          path="/api/v1/cart/items/{id}"
          description="Remove cart item. Returns 204 No Content on success."
          onExecute={() =>
            withToken(() =>
              apiRequest(`/api/v1/cart/items/${deleteItemId}`, {
                method: "DELETE",
              })
            )
          }
        >
          <div>
            <Label className="text-xs">id (cart item id)</Label>
            <Input
              value={deleteItemId}
              onChange={(e) => setDeleteItemId(e.target.value)}
              placeholder="UUID"
              className="h-8 text-xs"
            />
          </div>
        </EndpointCard>

        <SectionHeader title="Checkout" />

        <EndpointCard
          method="POST"
          path="/api/v1/checkout"
          description="Create checkout / payment intent. Returns checkoutId, paymentIntentClientSecret, total, and more."
          onExecute={() =>
            withToken(() =>
              apiRequest("/api/v1/checkout", {
                method: "POST",
                body: JSON.stringify({
                  shippingAddressId: shippingAddrId,
                  ...(billingAddrId ? { billingAddressId: billingAddrId } : {}),
                  ...(checkoutNotes ? { notes: checkoutNotes } : {}),
                }),
              })
            )
          }
        >
          <div className="space-y-2">
            <div>
              <Label className="text-xs">shippingAddressId</Label>
              <Input
                value={shippingAddrId}
                onChange={(e) => setShippingAddrId(e.target.value)}
                placeholder="UUID"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">billingAddressId (optional)</Label>
              <Input
                value={billingAddrId}
                onChange={(e) => setBillingAddrId(e.target.value)}
                placeholder="UUID (defaults to shippingAddressId)"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">notes (optional)</Label>
              <Input
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Order notes..."
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EndpointCard>

        <EndpointCard
          method="POST"
          path="/api/v1/checkout/complete"
          description="Complete checkout after payment. Returns order object."
          onExecute={() =>
            withToken(() =>
              apiRequest("/api/v1/checkout/complete", {
                method: "POST",
                body: JSON.stringify({
                  checkoutId,
                  paymentIntentId,
                }),
              })
            )
          }
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">checkoutId</Label>
              <Input
                value={checkoutId}
                onChange={(e) => setCheckoutId(e.target.value)}
                placeholder="UUID"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">paymentIntentId</Label>
              <Input
                value={paymentIntentId}
                onChange={(e) => setPaymentIntentId(e.target.value)}
                placeholder="pi_..."
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EndpointCard>
      </div>
    </div>
  )
}
