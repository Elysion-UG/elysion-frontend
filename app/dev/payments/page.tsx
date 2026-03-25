"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const MC: Record<string, string> = { GET: "bg-blue-100 text-blue-800", POST: "bg-green-100 text-green-800" }

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

export default function DevPaymentsPage() {
  const [token, setToken] = useState("")

  // Create intent
  const [orderId, setOrderId] = useState("")
  const [currency, setCurrency] = useState("EUR")

  // Get status
  const [paymentId, setPaymentId] = useState("")

  // Webhook
  const [webhookEvent, setWebhookEvent] = useState("payment_intent.succeeded")
  const [webhookPayload, setWebhookPayload] = useState('{\n  "id": "pi_test123",\n  "amount": 2999,\n  "currency": "eur",\n  "metadata": {\n    "orderId": ""\n  }\n}')

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Payments API Test</h1>
        <p className="text-sm text-slate-500 mb-6">Payment-Intent erstellen, Status abfragen, Webhook simulieren</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bearer Token (BUYER)</CardTitle></CardHeader>
          <CardContent>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGci..." className="font-mono text-xs bg-white" />
          </CardContent>
        </Card>

        <EC method="POST" path="/api/v1/payments/create-intent" auth="BUYER" description="Payment-Intent erstellen (Stripe)"
          onExecute={() => call("POST", "/api/v1/payments/create-intent", {
            orderId,
            currency,
          }, token)}>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Order-ID</Label><Input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="UUID der Bestellung" className="h-8 text-xs" /></div>
            <div>
              <Label className="text-xs">Währung</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </EC>

        <Card className="mb-4 border-slate-200">
          <CardContent className="pt-4">
            <Label className="text-xs font-semibold">Payment-ID (für GET Status)</Label>
            <Input value={paymentId} onChange={e => setPaymentId(e.target.value)} placeholder="UUID des Payments" className="h-8 text-xs mt-1" />
          </CardContent>
        </Card>

        <EC method="GET" path="/api/v1/payments/{id}" auth="BUYER" description="Payment-Status abrufen"
          onExecute={() => call("GET", `/api/v1/payments/${paymentId}`, undefined, token)} />

        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 mt-6">Webhook (Simulation)</h2>
        <p className="text-xs text-slate-500 mb-4">Simuliert einen eingehenden Stripe-Webhook. In Production wird die Signatur geprüft — hier wird sie übersprungen.</p>

        <EC method="POST" path="/api/v1/payments/webhook" auth="PUBLIC (Stripe Sig)" description="Stripe Webhook simulieren"
          onExecute={() => {
            let payload = {}
            try { payload = JSON.parse(webhookPayload) } catch { /* ignore */ }
            return call("POST", "/api/v1/payments/webhook", { type: webhookEvent, data: { object: payload } })
          }}>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Event-Typ</Label>
              <Select value={webhookEvent} onValueChange={setWebhookEvent}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled", "charge.refunded"].map(e =>
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Payload (JSON — data.object)</Label>
              <Textarea value={webhookPayload} onChange={e => setWebhookPayload(e.target.value)} className="text-xs h-32 font-mono" />
            </div>
          </div>
        </EC>
      </div>
    </div>
  )
}
