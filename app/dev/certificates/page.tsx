"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { apiRequest, setAccessToken } from "@/src/lib/api-client"

const MC: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  DELETE: "bg-red-100 text-red-800",
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
          <span className="break-all text-slate-700">{path}</span>
          <span className="ml-auto shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
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
            className={`mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded border p-3 text-xs ${
              isError ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-slate-50"
            }`}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default function DevCertificatesPage() {
  const [token, setToken] = useState("")

  // Create certificate fields
  const [certName, setCertName] = useState("")
  const [certIssuingBody, setCertIssuingBody] = useState("")
  const [certDescription, setCertDescription] = useState("")
  const [certValidFrom, setCertValidFrom] = useState("")
  const [certValidUntil, setCertValidUntil] = useState("")
  const [certType, setCertType] = useState("ORGANIC")

  // Get by ID
  const [certId, setCertId] = useState("")

  // Link / Unlink
  const [linkProductId, setLinkProductId] = useState("")
  const [linkCertId, setLinkCertId] = useState("")

  function applyToken(t: string) {
    setAccessToken(t || null)
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
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Certificate Endpoints</h1>
        <p className="mb-6 text-sm text-slate-500">
          Create, list, and link seller certificates to products.
        </p>

        {/* Token card */}
        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bearer Token (SELLER)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGci..."
              className="bg-white font-mono text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyToken(token)}
              className="border-teal-300 text-teal-700"
            >
              Apply Token
            </Button>
          </CardContent>
        </Card>

        {/* ── Certificate CRUD ─────────────────────────────────────────────── */}
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Certificate CRUD
        </h2>

        <EC
          method="POST"
          path="/api/v1/certificates"
          auth="SELLER"
          description="Create a new certificate for the authenticated seller."
          onExecute={() =>
            apiRequest("/api/v1/certificates", {
              method: "POST",
              body: JSON.stringify({
                name: certName,
                issuingBody: certIssuingBody,
                ...(certDescription ? { description: certDescription } : {}),
                validFrom: certValidFrom || undefined,
                ...(certValidUntil ? { validUntil: certValidUntil } : {}),
                certificateType: certType,
              }),
            })
          }
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                placeholder="Bio Certificate"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Issuing Body</Label>
              <Input
                value={certIssuingBody}
                onChange={(e) => setCertIssuingBody(e.target.value)}
                placeholder="Demeter e.V."
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Certificate Type</Label>
              <Select value={certType} onValueChange={setCertType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "ORGANIC",
                    "FAIR_TRADE",
                    "CO2_NEUTRAL",
                    "RECYCLED",
                    "ENERGY_EFFICIENT",
                    "VEGAN",
                    "CRUELTY_FREE",
                    "FSC",
                    "RAINFOREST_ALLIANCE",
                    "OTHER",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valid From</Label>
              <Input
                type="date"
                value={certValidFrom}
                onChange={(e) => setCertValidFrom(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Valid Until (optional)</Label>
              <Input
                type="date"
                value={certValidUntil}
                onChange={(e) => setCertValidUntil(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Description (optional)</Label>
              <Textarea
                value={certDescription}
                onChange={(e) => setCertDescription(e.target.value)}
                placeholder="Additional details..."
                className="h-16 text-xs"
              />
            </div>
          </div>
        </EC>

        <EC
          method="GET"
          path="/api/v1/certificates"
          auth="SELLER"
          description="List all certificates belonging to the authenticated seller."
          onExecute={() => apiRequest("/api/v1/certificates")}
        />

        <Card className="mb-4 border-slate-200">
          <CardContent className="pt-4">
            <Label className="text-xs font-semibold">Certificate ID (for GET by ID)</Label>
            <Input
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="UUID of the certificate"
              className="mt-1 h-8 text-xs"
            />
          </CardContent>
        </Card>

        <EC
          method="GET"
          path="/api/v1/certificates/{id}"
          auth="SELLER"
          description="Get a single certificate by ID. Returns { id, name, issuingBody, status, validFrom, validUntil, ... }"
          onExecute={() => apiRequest(`/api/v1/certificates/${certId}`)}
        />

        {/* ── Product-Certificate Links ───────────────────────────────────── */}
        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Product-Certificate Links
        </h2>

        <Card className="mb-4 border-slate-200">
          <CardContent className="grid grid-cols-2 gap-2 pt-4">
            <div>
              <Label className="text-xs font-semibold">Product ID</Label>
              <Input
                value={linkProductId}
                onChange={(e) => setLinkProductId(e.target.value)}
                placeholder="UUID"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Certificate ID</Label>
              <Input
                value={linkCertId}
                onChange={(e) => setLinkCertId(e.target.value)}
                placeholder="UUID"
                className="mt-1 h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <EC
          method="POST"
          path="/api/v1/products/{productId}/certificates"
          auth="SELLER"
          description="Link an existing certificate to a product. Both must belong to the authenticated seller."
          onExecute={() =>
            apiRequest(`/api/v1/products/${linkProductId}/certificates`, {
              method: "POST",
              body: JSON.stringify({ certificateId: linkCertId }),
            })
          }
        />

        <EC
          method="DELETE"
          path="/api/v1/products/{productId}/certificates/{certificateId}"
          auth="SELLER"
          description="Unlink a certificate from a product. Returns 204 No Content on success."
          onExecute={() =>
            apiRequest(`/api/v1/products/${linkProductId}/certificates/${linkCertId}`, {
              method: "DELETE",
            })
          }
        />
      </div>
    </div>
  )
}
