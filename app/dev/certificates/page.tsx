"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const MC: Record<string, string> = { GET: "bg-blue-100 text-blue-800", POST: "bg-green-100 text-green-800", DELETE: "bg-red-100 text-red-800" }

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

export default function DevCertificatesPage() {
  const [token, setToken] = useState("")

  // Create
  const [certType, setCertType] = useState("ORGANIC")
  const [certTitle, setCertTitle] = useState("")
  const [certIssuer, setCertIssuer] = useState("")
  const [certDocUrl, setCertDocUrl] = useState("")
  const [certIssueDate, setCertIssueDate] = useState("")
  const [certExpiry, setCertExpiry] = useState("")

  // Get by ID
  const [certId, setCertId] = useState("")

  // Link / Unlink
  const [linkCertId, setLinkCertId] = useState("")
  const [linkProductId, setLinkProductId] = useState("")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Certificates API Test</h1>
        <p className="text-sm text-slate-500 mb-6">Seller-Zertifikate erstellen, auflisten, mit Produkten verknüpfen</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bearer Token (SELLER)</CardTitle></CardHeader>
          <CardContent>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGci..." className="font-mono text-xs bg-white" />
          </CardContent>
        </Card>

        <EC method="GET" path="/api/v1/certificates" auth="SELLER" description="Alle eigenen Zertifikate abrufen"
          onExecute={() => call("GET", "/api/v1/certificates", undefined, token)} />

        <EC method="POST" path="/api/v1/certificates" auth="SELLER" description="Neues Zertifikat erstellen"
          onExecute={() => call("POST", "/api/v1/certificates", {
            certificateType: certType,
            title: certTitle,
            issuerName: certIssuer,
            ...(certDocUrl ? { documentUrl: certDocUrl } : {}),
            ...(certIssueDate ? { issueDate: certIssueDate } : {}),
            ...(certExpiry ? { expiryDate: certExpiry } : {}),
          }, token)}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Typ</Label>
              <Select value={certType} onValueChange={setCertType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ORGANIC", "FAIR_TRADE", "CO2_NEUTRAL", "RECYCLED", "ENERGY_EFFICIENT", "VEGAN", "CRUELTY_FREE", "FSC", "RAINFOREST_ALLIANCE", "OTHER"].map(t =>
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Titel</Label><Input value={certTitle} onChange={e => setCertTitle(e.target.value)} placeholder="Bio-Zertifikat" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Aussteller</Label><Input value={certIssuer} onChange={e => setCertIssuer(e.target.value)} placeholder="Demeter e.V." className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Dokument-URL (optional)</Label><Input value={certDocUrl} onChange={e => setCertDocUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Ausstellungsdatum</Label><Input type="date" value={certIssueDate} onChange={e => setCertIssueDate(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Ablaufdatum (optional)</Label><Input type="date" value={certExpiry} onChange={e => setCertExpiry(e.target.value)} className="h-8 text-xs" /></div>
          </div>
        </EC>

        <Card className="mb-4 border-slate-200">
          <CardContent className="pt-4">
            <Label className="text-xs font-semibold">Zertifikat-ID (für GET by ID)</Label>
            <Input value={certId} onChange={e => setCertId(e.target.value)} placeholder="UUID des Zertifikats" className="h-8 text-xs mt-1" />
          </CardContent>
        </Card>

        <EC method="GET" path="/api/v1/certificates/{id}" auth="SELLER" description="Einzelnes Zertifikat abrufen"
          onExecute={() => call("GET", `/api/v1/certificates/${certId}`, undefined, token)} />

        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 mt-6">Produkt-Verknüpfung</h2>

        <Card className="mb-4 border-slate-200">
          <CardContent className="pt-4 grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-semibold">Zertifikat-ID</Label>
              <Input value={linkCertId} onChange={e => setLinkCertId(e.target.value)} placeholder="UUID" className="h-8 text-xs mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Produkt-ID</Label>
              <Input value={linkProductId} onChange={e => setLinkProductId(e.target.value)} placeholder="UUID" className="h-8 text-xs mt-1" />
            </div>
          </CardContent>
        </Card>

        <EC method="POST" path="/api/v1/certificates/{id}/products/{productId}" auth="SELLER" description="Zertifikat mit Produkt verknüpfen"
          onExecute={() => call("POST", `/api/v1/certificates/${linkCertId}/products/${linkProductId}`, {}, token)} />

        <EC method="DELETE" path="/api/v1/certificates/{id}/products/{productId}" auth="SELLER" description="Zertifikat von Produkt trennen"
          onExecute={() => call("DELETE", `/api/v1/certificates/${linkCertId}/products/${linkProductId}`, undefined, token)} />
      </div>
    </div>
  )
}
