"use client"

import { useState, useRef } from "react"
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
const MC: Record<string, string> = { GET: "bg-blue-100 text-blue-800", POST: "bg-green-100 text-green-800", DELETE: "bg-red-100 text-red-800", PUT: "bg-purple-100 text-purple-800" }

async function call(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { method, headers, credentials: "include", body: body !== undefined ? JSON.stringify(body) : undefined })
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } } catch { return { status: res.status, data: text } }
}

async function upload(path: string, file: File, entityType: string, entityId: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const fd = new FormData()
  fd.append("file", file)
  if (entityType) fd.append("entityType", entityType)
  if (entityId) fd.append("entityId", entityId)
  const res = await fetch(`${API}${path}`, { method: "POST", headers, credentials: "include", body: fd })
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

export default function DevFilesPage() {
  const [token, setToken] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)

  // Upload
  const [entityType, setEntityType] = useState("PRODUCT")
  const [entityId, setEntityId] = useState("")

  // File ops
  const [fileId, setFileId] = useState("")

  // Link/Unlink
  const [linkFileId, setLinkFileId] = useState("")
  const [linkEntityType, setLinkEntityType] = useState("PRODUCT")
  const [linkEntityId, setLinkEntityId] = useState("")

  // Recommendations
  const [recLimit, setRecLimit] = useState("10")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Files & Recommendations API Test</h1>
        <p className="text-sm text-slate-500 mb-6">Dateien hochladen, verknüpfen, verwalten; Empfehlungen</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bearer Token</CardTitle></CardHeader>
          <CardContent>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGci..." className="font-mono text-xs bg-white" />
          </CardContent>
        </Card>

        <Tabs defaultValue="upload">
          <TabsList className="mb-4">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="manage">Verwalten</TabsTrigger>
            <TabsTrigger value="link">Verknüpfen</TabsTrigger>
            <TabsTrigger value="recommendations">Empfehlungen</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-mono">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">POST</span>
                  <span className="text-slate-700">/api/v1/files/upload</span>
                  <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">AUTH</span>
                </CardTitle>
                <CardDescription className="text-xs">Datei hochladen (multipart/form-data)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Entity-Typ</Label>
                    <Select value={entityType} onValueChange={setEntityType}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["PRODUCT", "CERTIFICATE", "USER", "ORDER"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Entity-ID</Label><Input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
                </div>
                <div>
                  <Label className="text-xs">Datei auswählen</Label>
                  <input ref={fileRef} type="file" className="mt-1 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                </div>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={async () => {
                  const file = fileRef.current?.files?.[0]
                  if (!file) { toast.error("Keine Datei ausgewählt"); return }
                  try {
                    const r = await upload("/api/v1/files/upload", file, entityType, entityId, token)
                    toast.success("OK")
                    console.log(r)
                    alert(JSON.stringify(r, null, 2))
                  } catch (e: unknown) {
                    toast.error(e instanceof Error ? e.message : String(e))
                  }
                }}>Upload</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">File-ID (für alle folgenden Endpunkte)</Label>
                <Input value={fileId} onChange={e => setFileId(e.target.value)} placeholder="UUID der Datei" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>

            <EC method="GET" path="/api/v1/files/{id}" auth="AUTH" description="Datei-Metadaten abrufen"
              onExecute={() => call("GET", `/api/v1/files/${fileId}`, undefined, token)} />

            <EC method="GET" path="/api/v1/files/{id}/content" auth="AUTH" description="Datei-Inhalt / Download-URL abrufen"
              onExecute={() => call("GET", `/api/v1/files/${fileId}/content`, undefined, token)} />

            <EC method="DELETE" path="/api/v1/files/{id}" auth="AUTH" description="Datei löschen"
              onExecute={() => call("DELETE", `/api/v1/files/${fileId}`, undefined, token)} />

            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-mono">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">PUT</span>
                  <span className="text-slate-700">/api/v1/files/{"{id}"}/replace</span>
                  <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">AUTH</span>
                </CardTitle>
                <CardDescription className="text-xs">Datei ersetzen (neue Version hochladen)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Neue Datei</Label>
                  <input ref={replaceRef} type="file" className="mt-1 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                </div>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={async () => {
                  const file = replaceRef.current?.files?.[0]
                  if (!file) { toast.error("Keine Datei ausgewählt"); return }
                  const headers: Record<string, string> = {}
                  if (token) headers["Authorization"] = `Bearer ${token}`
                  const fd = new FormData()
                  fd.append("file", file)
                  try {
                    const res = await fetch(`${API}/api/v1/files/${fileId}/replace`, { method: "PUT", headers, credentials: "include", body: fd })
                    const text = await res.text()
                    toast.success("OK")
                    alert(JSON.stringify(JSON.parse(text), null, 2))
                  } catch (e: unknown) {
                    toast.error(e instanceof Error ? e.message : String(e))
                  }
                }}>Replace</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link">
            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4 space-y-2">
                <div><Label className="text-xs font-semibold">File-ID</Label><Input value={linkFileId} onChange={e => setLinkFileId(e.target.value)} placeholder="UUID der Datei" className="h-8 text-xs mt-1" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Entity-Typ</Label>
                    <Select value={linkEntityType} onValueChange={setLinkEntityType}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["PRODUCT", "CERTIFICATE", "USER", "ORDER"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Entity-ID</Label><Input value={linkEntityId} onChange={e => setLinkEntityId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
                </div>
              </CardContent>
            </Card>

            <EC method="POST" path="/api/v1/files/{id}/link" auth="AUTH" description="Datei mit Entity verknüpfen"
              onExecute={() => call("POST", `/api/v1/files/${linkFileId}/link`, { entityType: linkEntityType, entityId: linkEntityId }, token)} />

            <EC method="POST" path="/api/v1/files/{id}/unlink" auth="AUTH" description="Datei-Verknüpfung aufheben"
              onExecute={() => call("POST", `/api/v1/files/${linkFileId}/unlink`, { entityType: linkEntityType, entityId: linkEntityId }, token)} />
          </TabsContent>

          <TabsContent value="recommendations">
            <EC method="GET" path="/api/v1/recommendations" auth="PUBLIC" description="Personalisierte Produktempfehlungen abrufen"
              onExecute={() => call("GET", `/api/v1/recommendations?limit=${recLimit}`, undefined, token || undefined)}>
              <div><Label className="text-xs">Limit</Label><Input type="number" value={recLimit} onChange={e => setRecLimit(e.target.value)} className="h-8 text-xs" /></div>
            </EC>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
