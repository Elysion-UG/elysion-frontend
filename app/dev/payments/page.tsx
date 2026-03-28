"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { apiRequest } from "@/src/lib/api-client"

const MC: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
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
  warning?: string
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
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold ${MC[method] ?? "bg-gray-100 text-gray-800"}`}
          >
            {method}
          </span>
          <span className="text-slate-700">{path}</span>
          <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
            {auth}
          </span>
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
        {warning && (
          <div className="mt-2 rounded border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs text-yellow-800">
            {warning}
          </div>
        )}
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
            className={`mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded border p-3 text-xs ${
              isError ? "border-red-200 bg-red-50 text-red-800" : "bg-slate-50"
            }`}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default function DevPaymentsPage() {
  const [token, setToken] = useState("")

  // Create intent
  const [orderId, setOrderId] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("EUR")

  // Get status
  const [paymentId, setPaymentId] = useState("")

  // Webhook
  const [webhookType, setWebhookType] = useState("payment_intent.succeeded")
  const [webhookPaymentIntentId, setWebhookPaymentIntentId] = useState("")

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
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Payment Endpoints</h1>
        <p className="mb-6 text-sm text-slate-500">
          Create payment intent, get status, simulate Stripe webhook
        </p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bearer Token (AUTH endpoints)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGci..."
              className="bg-white font-mono text-xs"
            />
          </CardContent>
        </Card>

        <EC
          method="POST"
          path="/api/v1/payments/create-intent"
          auth="AUTH"
          description="Create a Stripe payment intent for an order."
          onExecute={() =>
            apiRequest("/api/v1/payments/create-intent", {
              method: "POST",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: JSON.stringify({
                orderId,
                amountCents: amount !== "" ? Number(amount) : undefined,
                currency,
              }),
            })
          }
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Order ID</Label>
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="UUID of the order"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Amount (cents)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2999"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Currency</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="EUR"
              className="h-8 text-xs"
            />
          </div>
        </EC>

        <Card className="mb-4 border-slate-200">
          <CardContent className="pt-4">
            <Label className="text-xs font-semibold">Payment ID (for GET status below)</Label>
            <Input
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              placeholder="UUID of the payment"
              className="mt-1 h-8 text-xs"
            />
          </CardContent>
        </Card>

        <EC
          method="GET"
          path="/api/v1/payments/{id}"
          auth="AUTH"
          description="Get payment status by payment ID. Returns id, status, amountCents, currency, createdAt."
          onExecute={() =>
            apiRequest(`/api/v1/payments/${paymentId}`, {
              method: "GET",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
          }
        />

        <EC
          method="POST"
          path="/api/v1/payments/webhook"
          auth="PUBLIC"
          description="Simulate a Stripe webhook event. In production this is called by Stripe with a signature."
          warning="⚠️ Nur für Tests — wird normalerweise von Stripe aufgerufen"
          onExecute={() =>
            apiRequest("/api/v1/payments/webhook", {
              method: "POST",
              body: JSON.stringify({
                type: webhookType,
                data: {
                  object: {
                    id: webhookPaymentIntentId,
                    status: "succeeded",
                  },
                },
              }),
            })
          }
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Event Type</Label>
              <Input
                value={webhookType}
                onChange={(e) => setWebhookType(e.target.value)}
                placeholder="payment_intent.succeeded"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Payment Intent ID</Label>
              <Input
                value={webhookPaymentIntentId}
                onChange={(e) => setWebhookPaymentIntentId(e.target.value)}
                placeholder="pi_test123"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EC>
      </div>
    </div>
  )
}
