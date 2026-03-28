"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
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
import Link from "next/link"
import { apiRequest, setAccessToken } from "@/src/lib/api-client"

const MC: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
}

function EC({
  method,
  path,
  auth,
  description,
  children,
  onExecute,
  warning,
}: {
  method: string
  path: string
  auth: string
  description: string
  children?: React.ReactNode
  onExecute: () => Promise<unknown>
  warning?: boolean
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
    <Card className={`mb-4 ${warning ? "border-amber-300 bg-amber-50" : ""}`}>
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

export default function DevAdminFinancePage() {
  const [token, setToken] = useState("")

  // Products
  const [productPage, setProductPage] = useState("0")
  const [productSize, setProductSize] = useState("20")
  const [productStatus, setProductStatus] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [productId, setProductId] = useState("")

  // Orders
  const [orderPage, setOrderPage] = useState("0")
  const [orderSize, setOrderSize] = useState("20")
  const [orderStatus, setOrderStatus] = useState("")
  const [orderPaymentStatus, setOrderPaymentStatus] = useState("")
  const [orderId, setOrderId] = useState("")

  // Payments
  const [paymentPage, setPaymentPage] = useState("0")
  const [paymentSize, setPaymentSize] = useState("20")
  const [paymentStatus, setPaymentStatus] = useState("")
  const [paymentId, setPaymentId] = useState("")

  // Refunds
  const [refundPage, setRefundPage] = useState("0")
  const [refundSize, setRefundSize] = useState("20")
  const [refundPaymentId, setRefundPaymentId] = useState("")
  const [refundAmountCents, setRefundAmountCents] = useState("")
  const [refundReason, setRefundReason] = useState("")

  // Settlements
  const [settlementPage, setSettlementPage] = useState("0")
  const [settlementSize, setSettlementSize] = useState("20")
  const [settlementSellerId, setSettlementSellerId] = useState("")

  // Payouts
  const [payoutPage, setPayoutPage] = useState("0")
  const [payoutSize, setPayoutSize] = useState("20")
  const [payoutListStatus, setPayoutListStatus] = useState("")
  const [payoutSellerId, setPayoutSellerId] = useState("")
  const [payoutAmountCents, setPayoutAmountCents] = useState("")
  const [payoutCurrency, setPayoutCurrency] = useState("EUR")

  function applyToken() {
    setAccessToken(token || null)
  }

  function req<T>(method: string, path: string, body?: unknown): Promise<T> {
    applyToken()
    return apiRequest<T>(path, {
      method,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
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
        <h1 className="mb-1 text-2xl font-bold text-slate-800">
          Admin: Finance & Maintenance API Test
        </h1>
        <p className="mb-4 text-sm text-slate-500">
          Products, Orders, Payments, Refunds, Settlements, Payouts, Maintenance
        </p>

        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Requires ADMIN role &mdash; login at{" "}
            <Link href="/login/admin" className="underline">
              /login/admin
            </Link>{" "}
            first
          </span>
        </div>

        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-800">Admin Bearer Token required</CardTitle>
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

        <Tabs defaultValue="products">
          <TabsList className="mb-4 h-auto flex-wrap gap-1">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          {/* Products */}
          <TabsContent value="products">
            <h2 className="mb-3 text-sm font-semibold text-slate-600">Products</h2>

            <EC
              method="GET"
              path="/api/v1/admin/products"
              auth="ADMIN"
              description="List all products across all sellers (paginated, filterable by status and search)"
              onExecute={() => {
                const params = new URLSearchParams({ page: productPage, size: productSize })
                if (productStatus) params.set("status", productStatus)
                if (productSearch) params.set("search", productSearch)
                return req("GET", `/api/v1/admin/products?${params}`)
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Page</Label>
                  <Input
                    type="number"
                    value={productPage}
                    onChange={(e) => setProductPage(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    value={productSize}
                    onChange={(e) => setProductSize(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status (optional)</Label>
                  <Select value={productStatus} onValueChange={setProductStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="all" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">all</SelectItem>
                      {["DRAFT", "REVIEW", "ACTIVE", "INACTIVE", "REJECTED"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Search (optional)</Label>
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="name or SKU"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </EC>

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">
                  Product ID (for detail / activate / deactivate)
                </Label>
                <Input
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="UUID"
                  className="mt-1 h-8 text-xs"
                />
              </CardContent>
            </Card>

            <EC
              method="GET"
              path="/api/v1/admin/products/{id}"
              auth="ADMIN"
              description="Get full product detail by ID"
              onExecute={() => req("GET", `/api/v1/admin/products/${productId}`)}
            />

            <EC
              method="PATCH"
              path="/api/v1/admin/products/{id}/activate"
              auth="ADMIN"
              description="Force-activate a product (bypasses normal state machine)"
              onExecute={() => req("PATCH", `/api/v1/admin/products/${productId}/activate`)}
            />

            <EC
              method="PATCH"
              path="/api/v1/admin/products/{id}/deactivate"
              auth="ADMIN"
              description="Deactivate a product"
              onExecute={() => req("PATCH", `/api/v1/admin/products/${productId}/deactivate`)}
            />
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <h2 className="mb-3 text-sm font-semibold text-slate-600">Orders</h2>

            <EC
              method="GET"
              path="/api/v1/admin/orders"
              auth="ADMIN"
              description="List all orders (paginated, filterable by status and payment status)"
              onExecute={() => {
                const params = new URLSearchParams({ page: orderPage, size: orderSize })
                if (orderStatus) params.set("status", orderStatus)
                if (orderPaymentStatus) params.set("paymentStatus", orderPaymentStatus)
                return req("GET", `/api/v1/admin/orders?${params}`)
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Page</Label>
                  <Input
                    type="number"
                    value={orderPage}
                    onChange={(e) => setOrderPage(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    value={orderSize}
                    onChange={(e) => setOrderSize(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status (optional)</Label>
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="all" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">all</SelectItem>
                      {[
                        "PENDING",
                        "PROCESSING",
                        "SHIPPED",
                        "DELIVERED",
                        "CANCELLED",
                        "REFUNDED",
                      ].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Payment Status (optional)</Label>
                  <Select value={orderPaymentStatus} onValueChange={setOrderPaymentStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="all" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">all</SelectItem>
                      {["PENDING", "PAID", "FAILED", "REFUNDED"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </EC>

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Order ID (for detail)</Label>
                <Input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="UUID"
                  className="mt-1 h-8 text-xs"
                />
              </CardContent>
            </Card>

            <EC
              method="GET"
              path="/api/v1/admin/orders/{id}"
              auth="ADMIN"
              description="Get full order detail by ID"
              onExecute={() => req("GET", `/api/v1/admin/orders/${orderId}`)}
            />
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <h2 className="mb-3 text-sm font-semibold text-slate-600">Payments</h2>

            <EC
              method="GET"
              path="/api/v1/admin/payments"
              auth="ADMIN"
              description="List all payments (paginated, filterable by status)"
              onExecute={() => {
                const params = new URLSearchParams({ page: paymentPage, size: paymentSize })
                if (paymentStatus) params.set("status", paymentStatus)
                return req("GET", `/api/v1/admin/payments?${params}`)
              }}
            >
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Page</Label>
                  <Input
                    type="number"
                    value={paymentPage}
                    onChange={(e) => setPaymentPage(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    value={paymentSize}
                    onChange={(e) => setPaymentSize(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status (optional)</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="all" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">all</SelectItem>
                      {["PENDING", "PAID", "FAILED", "REFUNDED"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </EC>

            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Payment ID (for detail)</Label>
                <Input
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  placeholder="UUID"
                  className="mt-1 h-8 text-xs"
                />
              </CardContent>
            </Card>

            <EC
              method="GET"
              path="/api/v1/admin/payments/{id}"
              auth="ADMIN"
              description="Get full payment detail by ID"
              onExecute={() => req("GET", `/api/v1/admin/payments/${paymentId}`)}
            />
          </TabsContent>

          {/* Refunds */}
          <TabsContent value="refunds">
            <h2 className="mb-3 text-sm font-semibold text-slate-600">Refunds</h2>

            <EC
              method="GET"
              path="/api/v1/admin/refunds"
              auth="ADMIN"
              description="List all refunds (paginated)"
              onExecute={() => {
                const params = new URLSearchParams({ page: refundPage, size: refundSize })
                return req("GET", `/api/v1/admin/refunds?${params}`)
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Page</Label>
                  <Input
                    type="number"
                    value={refundPage}
                    onChange={(e) => setRefundPage(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    value={refundSize}
                    onChange={(e) => setRefundSize(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </EC>

            <EC
              method="POST"
              path="/api/v1/admin/refunds"
              auth="ADMIN"
              description="Create a refund for a payment"
              onExecute={() =>
                req("POST", "/api/v1/admin/refunds", {
                  paymentId: refundPaymentId,
                  amountCents: parseInt(refundAmountCents) || 0,
                  reason: refundReason,
                })
              }
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs">Payment ID</Label>
                  <Input
                    value={refundPaymentId}
                    onChange={(e) => setRefundPaymentId(e.target.value)}
                    placeholder="UUID of payment"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Amount (cents)</Label>
                  <Input
                    type="number"
                    value={refundAmountCents}
                    onChange={(e) => setRefundAmountCents(e.target.value)}
                    placeholder="2999"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Reason</Label>
                  <Input
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Defective item, ..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </EC>
          </TabsContent>

          {/* Settlements */}
          <TabsContent value="settlements">
            <h2 className="mb-3 text-sm font-semibold text-slate-600">Settlements</h2>

            <EC
              method="GET"
              path="/api/v1/admin/settlements"
              auth="ADMIN"
              description="List all settlements (paginated, optionally filter by seller)"
              onExecute={() => {
                const params = new URLSearchParams({ page: settlementPage, size: settlementSize })
                if (settlementSellerId) params.set("sellerId", settlementSellerId)
                return req("GET", `/api/v1/admin/settlements?${params}`)
              }}
            >
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Page</Label>
                  <Input
                    type="number"
                    value={settlementPage}
                    onChange={(e) => setSettlementPage(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    value={settlementSize}
                    onChange={(e) => setSettlementSize(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Seller ID (optional)</Label>
                  <Input
                    value={settlementSellerId}
                    onChange={(e) => setSettlementSellerId(e.target.value)}
                    placeholder="UUID"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </EC>
          </TabsContent>

          {/* Payouts */}
          <TabsContent value="payouts">
            <h2 className="mb-3 text-sm font-semibold text-slate-600">Payouts</h2>

            <EC
              method="GET"
              path="/api/v1/admin/payouts"
              auth="ADMIN"
              description="List all payouts (paginated, filterable by status)"
              onExecute={() => {
                const params = new URLSearchParams({ page: payoutPage, size: payoutSize })
                if (payoutListStatus) params.set("status", payoutListStatus)
                return req("GET", `/api/v1/admin/payouts?${params}`)
              }}
            >
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Page</Label>
                  <Input
                    type="number"
                    value={payoutPage}
                    onChange={(e) => setPayoutPage(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    value={payoutSize}
                    onChange={(e) => setPayoutSize(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status (optional)</Label>
                  <Select value={payoutListStatus} onValueChange={setPayoutListStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="all" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">all</SelectItem>
                      {["PENDING", "PROCESSING", "COMPLETED", "FAILED"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </EC>

            <EC
              method="POST"
              path="/api/v1/admin/payouts"
              auth="ADMIN"
              description="Create a payout for a seller"
              onExecute={() =>
                req("POST", "/api/v1/admin/payouts", {
                  sellerId: payoutSellerId,
                  amountCents: parseInt(payoutAmountCents) || 0,
                  currency: payoutCurrency || "EUR",
                })
              }
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3">
                  <Label className="text-xs">Seller ID</Label>
                  <Input
                    value={payoutSellerId}
                    onChange={(e) => setPayoutSellerId(e.target.value)}
                    placeholder="UUID of seller"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Amount (cents)</Label>
                  <Input
                    type="number"
                    value={payoutAmountCents}
                    onChange={(e) => setPayoutAmountCents(e.target.value)}
                    placeholder="15000"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Input
                    value={payoutCurrency}
                    onChange={(e) => setPayoutCurrency(e.target.value)}
                    placeholder="EUR"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </EC>
          </TabsContent>

          {/* Maintenance */}
          <TabsContent value="maintenance">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <strong>Warning:</strong> These are destructive admin operations. They modify data
                irreversibly. Normally run automatically via scheduler.
              </span>
            </div>

            <h2 className="mb-3 text-sm font-semibold text-slate-600">Maintenance</h2>

            <EC
              method="POST"
              path="/api/v1/admin/maintenance/cleanup-refresh-tokens"
              auth="ADMIN"
              description="Cleanup expired refresh tokens. Returns how many tokens were removed."
              onExecute={() => req("POST", "/api/v1/admin/maintenance/cleanup-refresh-tokens")}
              warning
            />

            <EC
              method="POST"
              path="/api/v1/admin/maintenance/expire-pending-orders"
              auth="ADMIN"
              description="Expire old pending orders that have not been paid. Returns how many orders were expired."
              onExecute={() => req("POST", "/api/v1/admin/maintenance/expire-pending-orders")}
              warning
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
