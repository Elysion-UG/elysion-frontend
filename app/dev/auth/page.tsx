"use client"

import { useState } from "react"
import { Toaster } from "sonner"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
}

async function call(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } }
  catch { return { status: res.status, data: text } }
}

function EndpointCard({
  method, path, auth, description, children, onExecute,
}: {
  method: string; path: string; auth: string; description: string
  children?: React.ReactNode; onExecute: () => Promise<unknown>
}) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<unknown>(null)

  const execute = async () => {
    setLoading(true)
    try {
      const res = await onExecute()
      setResponse(res)
      toast.success("Request gesendet")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setResponse({ error: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-mono">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[method] ?? "bg-gray-100"}`}>{method}</span>
          <span className="text-slate-700">{path}</span>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{auth}</span>
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        <Button size="sm" onClick={execute} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Execute
        </Button>
        {response !== null && (
          <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default function DevAuthPage() {
  const [token, setToken] = useState("")

  // Register
  const [regEmail, setRegEmail] = useState("test@example.com")
  const [regPassword, setRegPassword] = useState("Password123!")
  const [regFirst, setRegFirst] = useState("Max")
  const [regLast, setRegLast] = useState("Mustermann")
  const [regRole, setRegRole] = useState("BUYER")
  const [regCompany, setRegCompany] = useState("")

  // Login
  const [loginEmail, setLoginEmail] = useState("test@example.com")
  const [loginPassword, setLoginPassword] = useState("Password123!")

  // Verify email
  const [verifyToken, setVerifyToken] = useState("")
  const [verifyTokenGet, setVerifyTokenGet] = useState("")

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("")

  // Reset password
  const [resetToken, setResetToken] = useState("")
  const [resetPassword, setResetPassword] = useState("NewPassword123!")
  const [resetTokenGet, setResetTokenGet] = useState("")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Playground
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Auth API Test</h1>
        <p className="text-sm text-slate-500 mb-6">Alle Authentifizierungs-Endpunkte</p>

        {/* Bearer Token */}
        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bearer Token (für authentifizierte Endpunkte)</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="eyJhbGci... (nach Login automatisch befüllt)"
              className="font-mono text-xs bg-white"
            />
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(token); toast.success("Kopiert!") }}>
              <Copy className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>

        {/* 1. Register */}
        <EndpointCard
          method="POST" path="/api/v1/auth/register" auth="PUBLIC"
          description="Neuen Benutzer registrieren (BUYER oder SELLER)"
          onExecute={() => call("POST", "/api/v1/auth/register", {
            email: regEmail, password: regPassword, firstName: regFirst, lastName: regLast,
            role: regRole, ...(regRole === "SELLER" && regCompany ? { companyName: regCompany } : {}),
          })}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Email</Label><Input value={regEmail} onChange={e => setRegEmail(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Passwort</Label><Input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Vorname</Label><Input value={regFirst} onChange={e => setRegFirst(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Nachname</Label><Input value={regLast} onChange={e => setRegLast(e.target.value)} className="h-8 text-xs" /></div>
            <div>
              <Label className="text-xs">Rolle</Label>
              <Select value={regRole} onValueChange={setRegRole}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="BUYER">BUYER</SelectItem><SelectItem value="SELLER">SELLER</SelectItem></SelectContent>
              </Select>
            </div>
            {regRole === "SELLER" && (
              <div><Label className="text-xs">Firma</Label><Input value={regCompany} onChange={e => setRegCompany(e.target.value)} className="h-8 text-xs" /></div>
            )}
          </div>
        </EndpointCard>

        {/* 2. Login */}
        <EndpointCard
          method="POST" path="/api/v1/auth/login" auth="PUBLIC"
          description="Einloggen — gibt accessToken zurück (wird oben gespeichert)"
          onExecute={async () => {
            const res = await call("POST", "/api/v1/auth/login", { email: loginEmail, password: loginPassword })
            if (res.data?.data?.accessToken) {
              setToken(res.data.data.accessToken)
              toast.success("Token gespeichert!")
            }
            return res
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Email</Label><Input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Passwort</Label><Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        {/* 3. Refresh */}
        <EndpointCard
          method="POST" path="/api/v1/auth/refresh" auth="HttpOnly Cookie"
          description="Access Token erneuern via Refresh-Cookie (kein Token nötig)"
          onExecute={async () => {
            const res = await call("POST", "/api/v1/auth/refresh", {})
            if (res.data?.data?.accessToken) {
              setToken(res.data.data.accessToken)
              toast.success("Token erneuert!")
            }
            return res
          }}
        />

        {/* 4. Logout */}
        <EndpointCard
          method="POST" path="/api/v1/auth/logout" auth="AUTH"
          description="Ausloggen und Refresh-Token invalidieren"
          onExecute={() => call("POST", "/api/v1/auth/logout", {}, token)}
        />

        {/* 5. Verify Email (POST) */}
        <EndpointCard
          method="POST" path="/api/v1/auth/verify-email" auth="PUBLIC"
          description="Email-Adresse per Token verifizieren"
          onExecute={() => call("POST", "/api/v1/auth/verify-email", { token: verifyToken })}
        >
          <div><Label className="text-xs">Verification Token</Label><Input value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="Token aus Email" className="h-8 text-xs" /></div>
        </EndpointCard>

        {/* 6. Verify Email (GET) */}
        <EndpointCard
          method="GET" path="/api/v1/auth/verify-email?token=..." auth="PUBLIC"
          description="Email-Verification via Link (Query-Parameter)"
          onExecute={() => call("GET", `/api/v1/auth/verify-email?token=${encodeURIComponent(verifyTokenGet)}`)}
        >
          <div><Label className="text-xs">Token (Query-Param)</Label><Input value={verifyTokenGet} onChange={e => setVerifyTokenGet(e.target.value)} placeholder="Token aus Email-Link" className="h-8 text-xs" /></div>
        </EndpointCard>

        {/* 7. Forgot Password */}
        <EndpointCard
          method="POST" path="/api/v1/auth/forgot-password" auth="PUBLIC"
          description="Passwort-Reset-Email anfordern"
          onExecute={() => call("POST", "/api/v1/auth/forgot-password", { email: forgotEmail })}
        >
          <div><Label className="text-xs">Email</Label><Input value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="user@example.com" className="h-8 text-xs" /></div>
        </EndpointCard>

        {/* 8. Reset Password (POST) */}
        <EndpointCard
          method="POST" path="/api/v1/auth/reset-password" auth="PUBLIC"
          description="Neues Passwort setzen mit Reset-Token"
          onExecute={() => call("POST", "/api/v1/auth/reset-password", { token: resetToken, newPassword: resetPassword })}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Reset-Token</Label><Input value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="Token aus Email" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Neues Passwort</Label><Input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        {/* 9. Reset Password (GET) */}
        <EndpointCard
          method="GET" path="/api/v1/auth/reset-password?token=..." auth="PUBLIC"
          description="Reset-Passwort-Link (Query-Parameter)"
          onExecute={() => call("GET", `/api/v1/auth/reset-password?token=${encodeURIComponent(resetTokenGet)}`)}
        >
          <div><Label className="text-xs">Token (Query-Param)</Label><Input value={resetTokenGet} onChange={e => setResetTokenGet(e.target.value)} placeholder="Token aus Reset-Email-Link" className="h-8 text-xs" /></div>
        </EndpointCard>
      </div>
    </div>
  )
}
