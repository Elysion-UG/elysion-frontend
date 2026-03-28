"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import Link from "next/link"
import { apiRequest, setAccessToken } from "@/src/lib/api-client"

const MC: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
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
  const [isError, setIsError] = useState(false)

  const execute = async () => {
    setLoading(true)
    setIsError(false)
    try {
      const result = await onExecute()
      setResponse(result)
      toast.success("OK")
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      setResponse({ error: m })
      setIsError(true)
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
          <pre
            className={`mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded border p-3 text-xs ${isError ? "border-red-200 bg-red-50 text-red-800" : "bg-slate-50"}`}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="mb-3 mt-8 border-b border-slate-200 pb-1 text-base font-semibold text-slate-700">
      {title}
    </h2>
  )
}

export default function DevOrdersPage() {
  const [token, setToken] = useState("")

  // Buyer Orders
  const [buyerPage, setBuyerPage] = useState("0")
  const [buyerSize, setBuyerSize] = useState("10")
  const [buyerStatus, setBuyerStatus] = useState("")
  const [buyerOrderId, setBuyerOrderId] = useState("")

  // Seller Orders
  const [sellerPage, setSellerPage] = useState("0")
  const [sellerSize, setSellerSize] = useState("10")
  const [sellerStatus, setSellerStatus] = useState("")
  const [sellerOrderGroupId, setSellerOrderGroupId] = useState("")
  const [orderStatus, setOrderStatus] = useState("PROCESSING")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")

  // Settlements
  const [settlPage, setSettlPage] = useState("0")
  const [settlSize, setSettlSize] = useState("10")

  const applyToken = () => {
    setAccessToken(token || null)
  }

  function buildQuery(params: Record<string, string | number | undefined>) {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") q.set(k, String(v))
    }
    const s = q.toString()
    return s ? `?${s}` : ""
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/dev"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dev Index
        </Link>
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Orders Endpoints</h1>
        <p className="mb-6 text-sm text-slate-500">
          Buyer orders, seller order groups, shipping, settlements
        </p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bearer Token</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGci..."
              className="bg-white font-mono text-xs"
            />
            <Button size="sm" variant="outline" onClick={applyToken} className="shrink-0">
              Apply
            </Button>
          </CardContent>
        </Card>

        {/* ── Buyer Orders ─────────────────────────────────────── */}
        <SectionHeader title="Buyer Orders" />

        <EC
          method="GET"
          path="/api/v1/orders"
          auth="BUYER"
          description="List the authenticated buyer's orders. Supports pagination and optional status filter."
          onExecute={() => {
            applyToken()
            return apiRequest(
              `/api/v1/orders${buildQuery({ page: buyerPage, size: buyerSize, status: buyerStatus || undefined })}`
            )
          }}
        >
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">page</Label>
              <Input
                type="number"
                min="0"
                value={buyerPage}
                onChange={(e) => setBuyerPage(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">size</Label>
              <Input
                type="number"
                min="1"
                value={buyerSize}
                onChange={(e) => setBuyerSize(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">status (optional)</Label>
              <Input
                value={buyerStatus}
                onChange={(e) => setBuyerStatus(e.target.value)}
                placeholder="e.g. PAID"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EC>

        <EC
          method="GET"
          path="/api/v1/orders/{id}"
          auth="BUYER"
          description="Get full order detail including items, shipping address, and payment status."
          onExecute={() => {
            applyToken()
            return apiRequest(`/api/v1/orders/${buyerOrderId}`)
          }}
        >
          <div>
            <Label className="text-xs">id</Label>
            <Input
              value={buyerOrderId}
              onChange={(e) => setBuyerOrderId(e.target.value)}
              placeholder="UUID"
              className="h-8 text-xs"
            />
          </div>
        </EC>

        {/* ── Seller Orders ─────────────────────────────────────── */}
        <SectionHeader title="Seller Orders" />

        <EC
          method="GET"
          path="/api/v1/seller/orders"
          auth="SELLER"
          description="List the seller's order groups. Supports pagination and optional status filter."
          onExecute={() => {
            applyToken()
            return apiRequest(
              `/api/v1/seller/orders${buildQuery({ page: sellerPage, size: sellerSize, status: sellerStatus || undefined })}`
            )
          }}
        >
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">page</Label>
              <Input
                type="number"
                min="0"
                value={sellerPage}
                onChange={(e) => setSellerPage(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">size</Label>
              <Input
                type="number"
                min="1"
                value={sellerSize}
                onChange={(e) => setSellerSize(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">status (optional)</Label>
              <Input
                value={sellerStatus}
                onChange={(e) => setSellerStatus(e.target.value)}
                placeholder="e.g. PROCESSING"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EC>

        <Card className="mb-4 border-slate-200">
          <CardContent className="pt-4">
            <Label className="text-xs font-semibold">
              OrderGroup ID (used for all endpoints below)
            </Label>
            <Input
              value={sellerOrderGroupId}
              onChange={(e) => setSellerOrderGroupId(e.target.value)}
              placeholder="UUID of the order group"
              className="mt-1 h-8 text-xs"
            />
          </CardContent>
        </Card>

        <EC
          method="GET"
          path="/api/v1/seller/orders/{id}"
          auth="SELLER"
          description="Get seller order group detail."
          onExecute={() => {
            applyToken()
            return apiRequest(`/api/v1/seller/orders/${sellerOrderGroupId}`)
          }}
        />

        <EC
          method="PATCH"
          path="/api/v1/seller/orders/{id}/status"
          auth="SELLER"
          description="Update the status of an order group."
          onExecute={() => {
            applyToken()
            return apiRequest(`/api/v1/seller/orders/${sellerOrderGroupId}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status: orderStatus }),
            })
          }}
        >
          <div>
            <Label className="text-xs">status</Label>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </EC>

        <EC
          method="POST"
          path="/api/v1/seller/orders/{id}/ship"
          auth="SELLER"
          description="Mark the order group as shipped. Tracking number and carrier are optional."
          onExecute={() => {
            applyToken()
            return apiRequest(`/api/v1/seller/orders/${sellerOrderGroupId}/ship`, {
              method: "POST",
              body: JSON.stringify({
                ...(trackingNumber ? { trackingNumber } : {}),
                ...(carrier ? { carrier } : {}),
              }),
            })
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">trackingNumber (optional)</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="1Z999AA10123456784"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">carrier (optional)</Label>
              <Input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="DHL, UPS, ..."
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EC>

        <EC
          method="POST"
          path="/api/v1/seller/orders/{id}/deliver"
          auth="SELLER"
          description="Mark the order group as delivered. No request body required."
          onExecute={() => {
            applyToken()
            return apiRequest(`/api/v1/seller/orders/${sellerOrderGroupId}/deliver`, {
              method: "POST",
            })
          }}
        />

        {/* ── Seller Settlements ───────────────────────────────── */}
        <SectionHeader title="Seller Settlements" />

        <EC
          method="GET"
          path="/api/v1/seller/settlements"
          auth="SELLER"
          description="Get the seller's settlements. Returns paged list with id, amountCents, currency, status, createdAt."
          onExecute={() => {
            applyToken()
            return apiRequest(
              `/api/v1/seller/settlements${buildQuery({ page: settlPage, size: settlSize })}`
            )
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">page</Label>
              <Input
                type="number"
                min="0"
                value={settlPage}
                onChange={(e) => setSettlPage(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">size</Label>
              <Input
                type="number"
                min="1"
                value={settlSize}
                onChange={(e) => setSettlSize(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EC>
      </div>
    </div>
  )
}
