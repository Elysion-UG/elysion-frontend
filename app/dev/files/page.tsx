"use client"

import { useState, useRef } from "react"
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
import Link from "next/link"
import { apiRequest, apiUpload, setAccessToken } from "@/src/lib/api-client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
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
  extra,
}: {
  method: string
  path: string
  auth: string
  description: string
  children?: React.ReactNode
  onExecute: () => Promise<unknown>
  extra?: React.ReactNode
}) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<unknown>(null)
  const execute = async () => {
    setLoading(true)
    try {
      const r = await onExecute()
      setResponse(r)
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
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded border bg-slate-50 p-3 text-xs">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
        {extra}
      </CardContent>
    </Card>
  )
}

export default function DevFilesPage() {
  const [token, setToken] = useState("")

  // Upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [entityType, setEntityType] = useState("PRODUCT_IMAGE")
  const [entityId, setEntityId] = useState("")

  // File ops
  const [fileId, setFileId] = useState("")
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)

  // Replace
  const replaceRef = useRef<HTMLInputElement>(null)
  const [replaceFileId, setReplaceFileId] = useState("")

  // Link/Unlink
  const [linkFileId, setLinkFileId] = useState("")
  const [linkEntityType, setLinkEntityType] = useState("PRODUCT_IMAGE")
  const [linkEntityId, setLinkEntityId] = useState("")

  // Recommendations
  const [recLimit, setRecLimit] = useState("10")

  const applyToken = (t: string) => {
    setToken(t)
    setAccessToken(t || null)
  }

  const ENTITY_TYPES = ["PRODUCT_IMAGE", "PRODUCT", "CERTIFICATE", "USER", "ORDER"]

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
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Files &amp; Recommendations</h1>
        <p className="mb-6 text-sm text-slate-500">
          Upload, manage and link files; personalized recommendations
        </p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bearer Token (AUTH)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={token}
              onChange={(e) => applyToken(e.target.value)}
              placeholder="eyJhbGci..."
              className="bg-white font-mono text-xs"
            />
          </CardContent>
        </Card>

        {/* ── File Management ────────────────────────────────────────────── */}
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          File Management
        </h2>

        {/* 1. Upload */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2 font-mono text-sm">
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                POST
              </span>
              <span className="text-slate-700">/api/v1/files/upload</span>
              <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
                AUTH
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a file (multipart/form-data)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Entity ID (optional)</Label>
                <Input
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder="UUID"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">File</Label>
              <input
                ref={fileRef}
                type="file"
                className="mt-1 block w-full text-xs text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-teal-50 file:px-2 file:py-1 file:text-xs file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>
            <UploadButton fileRef={fileRef} entityType={entityType} entityId={entityId} />
          </CardContent>
        </Card>

        {/* Shared file ID for endpoints 2-4 */}
        <Card className="mb-4 border-slate-200">
          <CardContent className="pt-4">
            <Label className="text-xs font-semibold">File ID (for Get, Get Content, Delete)</Label>
            <Input
              value={fileId}
              onChange={(e) => {
                setFileId(e.target.value)
                setFilePreviewUrl(null)
              }}
              placeholder="UUID"
              className="mt-1 h-8 text-xs"
            />
          </CardContent>
        </Card>

        {/* 2. Get metadata */}
        <EC
          method="GET"
          path="/api/v1/files/{id}"
          auth="AUTH"
          description="Get file metadata"
          onExecute={() => apiRequest(`/api/v1/files/${fileId}`)}
        />

        {/* 3. Get content — show image preview */}
        <EC
          method="GET"
          path="/api/v1/files/{id}/content"
          auth="AUTH"
          description="Get file content. For images, a preview is shown below."
          onExecute={async () => {
            const url = `${API_BASE}/api/v1/files/${fileId}/content`
            setFilePreviewUrl(url)
            return { url, note: "Preview shown below (if image)" }
          }}
          extra={
            filePreviewUrl ? (
              <img src={filePreviewUrl} alt="preview" className="mt-2 max-h-40 rounded border" />
            ) : null
          }
        />

        {/* 4. Delete */}
        <EC
          method="DELETE"
          path="/api/v1/files/{id}"
          auth="AUTH"
          description="Delete file"
          onExecute={() => apiRequest(`/api/v1/files/${fileId}`, { method: "DELETE" })}
        />

        {/* 5 & 6: Link / Unlink */}
        <Card className="mb-4 border-slate-200">
          <CardContent className="space-y-2 pt-4">
            <div>
              <Label className="text-xs font-semibold">File ID (for Link / Unlink)</Label>
              <Input
                value={linkFileId}
                onChange={(e) => setLinkFileId(e.target.value)}
                placeholder="UUID"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Entity Type</Label>
                <Select value={linkEntityType} onValueChange={setLinkEntityType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Entity ID</Label>
                <Input
                  value={linkEntityId}
                  onChange={(e) => setLinkEntityId(e.target.value)}
                  placeholder="UUID"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <EC
          method="POST"
          path="/api/v1/files/{id}/link"
          auth="AUTH"
          description="Link file to an entity"
          onExecute={() =>
            apiRequest(`/api/v1/files/${linkFileId}/link`, {
              method: "POST",
              body: JSON.stringify({ entityType: linkEntityType, entityId: linkEntityId }),
            })
          }
        />

        <EC
          method="POST"
          path="/api/v1/files/{id}/unlink"
          auth="AUTH"
          description="Unlink file from an entity"
          onExecute={() =>
            apiRequest(`/api/v1/files/${linkFileId}/unlink`, {
              method: "POST",
              body: JSON.stringify({ entityType: linkEntityType, entityId: linkEntityId }),
            })
          }
        />

        {/* 7. Replace */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2 font-mono text-sm">
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                POST
              </span>
              <span className="text-slate-700">/api/v1/files/{"{id}"}/replace</span>
              <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
                AUTH
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Replace file content with a new file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">File ID</Label>
              <Input
                value={replaceFileId}
                onChange={(e) => setReplaceFileId(e.target.value)}
                placeholder="UUID"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">New File</Label>
              <input
                ref={replaceRef}
                type="file"
                className="mt-1 block w-full text-xs text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-teal-50 file:px-2 file:py-1 file:text-xs file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>
            <ReplaceButton replaceRef={replaceRef} replaceFileId={replaceFileId} />
          </CardContent>
        </Card>

        {/* ── Recommendations ───────────────────────────────────────────── */}
        <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Recommendations
        </h2>

        <EC
          method="GET"
          path="/api/v1/recommendations"
          auth="AUTH / BUYER"
          description="Get personalized product recommendations"
          onExecute={() => apiRequest(`/api/v1/recommendations?limit=${recLimit}`)}
        >
          <div>
            <Label className="text-xs">Limit</Label>
            <Input
              type="number"
              value={recLimit}
              onChange={(e) => setRecLimit(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </EC>
      </div>
    </div>
  )
}

// ── Upload sub-component (needs its own state for response display) ────────────
function UploadButton({
  fileRef,
  entityType,
  entityId,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>
  entityType: string
  entityId: string
}) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<unknown>(null)
  return (
    <>
      <Button
        size="sm"
        className="bg-teal-600 hover:bg-teal-700"
        disabled={loading}
        onClick={async () => {
          const file = fileRef.current?.files?.[0]
          if (!file) {
            toast.error("No file selected")
            return
          }
          setLoading(true)
          try {
            const fd = new FormData()
            fd.append("file", file)
            fd.append("entityType", entityType)
            if (entityId) fd.append("entityId", entityId)
            const r = await apiUpload("/api/v1/files/upload", fd)
            setResponse(r)
            toast.success("OK")
          } catch (e: unknown) {
            const m = e instanceof Error ? e.message : String(e)
            setResponse({ error: m })
            toast.error(m)
          } finally {
            setLoading(false)
          }
        }}
      >
        {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Upload
      </Button>
      {response !== null && (
        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded border bg-slate-50 p-3 text-xs">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </>
  )
}

function ReplaceButton({
  replaceRef,
  replaceFileId,
}: {
  replaceRef: React.RefObject<HTMLInputElement | null>
  replaceFileId: string
}) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<unknown>(null)
  return (
    <>
      <Button
        size="sm"
        className="bg-teal-600 hover:bg-teal-700"
        disabled={loading}
        onClick={async () => {
          const file = replaceRef.current?.files?.[0]
          if (!file) {
            toast.error("No file selected")
            return
          }
          setLoading(true)
          try {
            const fd = new FormData()
            fd.append("file", file)
            const r = await apiUpload(`/api/v1/files/${replaceFileId}/replace`, fd)
            setResponse(r)
            toast.success("OK")
          } catch (e: unknown) {
            const m = e instanceof Error ? e.message : String(e)
            setResponse({ error: m })
            toast.error(m)
          } finally {
            setLoading(false)
          }
        }}
      >
        {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Replace
      </Button>
      {response !== null && (
        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded border bg-slate-50 p-3 text-xs">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </>
  )
}
