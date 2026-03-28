"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft, Copy, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { apiRequest, setAccessToken, getAccessToken } from "@/src/lib/api-client"

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
  PUT: "bg-orange-100 text-orange-800",
  DELETE: "bg-red-100 text-red-800",
}

function EndpointCard({
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
      const res = await onExecute()
      setResponse(res)
      toast.success("Request completed")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setResponse({ error: msg })
      setIsError(true)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold ${METHOD_COLORS[method] ?? "bg-gray-100"}`}
          >
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
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Execute
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

export default function DevAuthPage() {
  const [tokenDisplay, setTokenDisplay] = useState<string | null>(getAccessToken())

  const refreshTokenDisplay = () => setTokenDisplay(getAccessToken())

  const [regEmail, setRegEmail] = useState("test@example.com")
  const [regPassword, setRegPassword] = useState("Password123!")
  const [regFirst, setRegFirst] = useState("Max")
  const [regLast, setRegLast] = useState("Mustermann")
  const [regRole, setRegRole] = useState("BUYER")
  const [regCompany, setRegCompany] = useState("")

  const [loginEmail, setLoginEmail] = useState("test@example.com")
  const [loginPassword, setLoginPassword] = useState("Password123!")
  const [verifyToken, setVerifyToken] = useState("")
  const [resendEmail, setResendEmail] = useState("")
  const [forgotEmail, setForgotEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [resetPassword, setResetPassword] = useState("NewPassword123!")

  const currentToken = tokenDisplay

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

        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Auth Endpoints</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">All authentication endpoints</p>
            <Badge variant="outline" className="text-xs">
              9 endpoints
            </Badge>
          </div>
        </div>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {currentToken ? (
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
              ) : (
                <XCircle className="h-4 w-4 text-slate-400" />
              )}
              Token Status
              {currentToken ? (
                <span className="ml-1 text-xs font-normal text-teal-700">Active</span>
              ) : (
                <span className="ml-1 text-xs font-normal text-slate-400">No token set</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              readOnly
              value={currentToken ? `${currentToken.slice(0, 40)}...` : ""}
              placeholder="No token — log in first"
              className="bg-white font-mono text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!currentToken}
              onClick={() => {
                if (currentToken) {
                  navigator.clipboard.writeText(currentToken)
                  toast.success("Token copied!")
                }
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* 1. Register */}
        <EndpointCard
          method="POST"
          path="/api/v1/auth/register"
          auth="PUBLIC"
          description="Register a new user account (BUYER or SELLER)"
          onExecute={async () => {
            const body: Record<string, string> = {
              email: regEmail,
              password: regPassword,
              firstName: regFirst,
              lastName: regLast,
              role: regRole,
            }
            if (regRole === "SELLER" && regCompany) body.companyName = regCompany
            return apiRequest("/api/v1/auth/register", {
              method: "POST",
              body: JSON.stringify(body),
            })
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">First Name</Label>
              <Input
                value={regFirst}
                onChange={(e) => setRegFirst(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Last Name</Label>
              <Input
                value={regLast}
                onChange={(e) => setRegLast(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={regRole} onValueChange={setRegRole}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUYER">BUYER</SelectItem>
                  <SelectItem value="SELLER">SELLER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {regRole === "SELLER" && (
              <div>
                <Label className="text-xs">Company Name</Label>
                <Input
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>
        </EndpointCard>

        {/* 2. Login */}
        <EndpointCard
          method="POST"
          path="/api/v1/auth/login"
          auth="PUBLIC"
          description="Login and receive an access token (stored in-memory via setAccessToken)"
          onExecute={async () => {
            const data = await apiRequest<{
              accessToken: string
              expiresIn: number
              user: { id: string; email: string; role: string }
            }>("/api/v1/auth/login", {
              method: "POST",
              body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            })
            if (data?.accessToken) {
              setAccessToken(data.accessToken)
              refreshTokenDisplay()
            }
            return data
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EndpointCard>

        {/* 3. Refresh */}
        <EndpointCard
          method="POST"
          path="/api/v1/auth/refresh"
          auth="HttpOnly Cookie"
          description="Refresh the access token using the HttpOnly refresh-token cookie (no body needed)"
          onExecute={async () => {
            const data = await apiRequest<{ accessToken: string; expiresIn: number }>(
              "/api/v1/auth/refresh",
              { method: "POST" }
            )
            if (data?.accessToken) {
              setAccessToken(data.accessToken)
              refreshTokenDisplay()
              toast.success("Token refreshed!")
            }
            return data
          }}
        />

        {/* 4. Logout */}
        <EndpointCard
          method="POST"
          path="/api/v1/auth/logout"
          auth="AUTH"
          description="Logout and invalidate the refresh token (returns 204 No Content)"
          onExecute={async () => {
            const data = await apiRequest("/api/v1/auth/logout", { method: "POST" })
            setAccessToken(null)
            refreshTokenDisplay()
            return data ?? { status: 204, message: "No Content" }
          }}
        />

        {/* 5. Verify Email */}
        <EndpointCard
          method="POST"
          path="/api/v1/auth/verify-email"
          auth="PUBLIC"
          description="Verify email address using a token from the verification email"
          onExecute={() =>
            apiRequest("/api/v1/auth/verify-email", {
              method: "POST",
              body: JSON.stringify({ token: verifyToken }),
            })
          }
        >
          <div>
            <Label className="text-xs">Verification Token</Label>
            <Input
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              placeholder="Token from verification email"
              className="h-8 text-xs"
            />
          </div>
        </EndpointCard>

        {/* 6. Resend Verification */}
        <EndpointCard
          method="POST"
          path="/api/v1/auth/resend-verification"
          auth="PUBLIC"
          description="Resend the email verification link to the given address"
          onExecute={() =>
            apiRequest("/api/v1/auth/resend-verification", {
              method: "POST",
              body: JSON.stringify({ email: resendEmail }),
            })
          }
        >
          <div>
            <Label className="text-xs">Email</Label>
            <Input
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="user@example.com"
              className="h-8 text-xs"
            />
          </div>
        </EndpointCard>

        {/* 7. Forgot Password */}
        <EndpointCard
          method="POST"
          path="/api/v1/auth/forgot-password"
          auth="PUBLIC"
          description="Request a password-reset email"
          onExecute={() =>
            apiRequest("/api/v1/auth/forgot-password", {
              method: "POST",
              body: JSON.stringify({ email: forgotEmail }),
            })
          }
        >
          <div>
            <Label className="text-xs">Email</Label>
            <Input
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="user@example.com"
              className="h-8 text-xs"
            />
          </div>
        </EndpointCard>

        {/* 8. Reset Password */}
        <EndpointCard
          method="POST"
          path="/api/v1/auth/reset-password"
          auth="PUBLIC"
          description="Set a new password using a reset token from the password-reset email"
          onExecute={() =>
            apiRequest("/api/v1/auth/reset-password", {
              method: "POST",
              body: JSON.stringify({ token: resetToken, newPassword: resetPassword }),
            })
          }
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Reset Token</Label>
              <Input
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Token from reset email"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">New Password</Label>
              <Input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </EndpointCard>

        {/* 9. Me */}
        <EndpointCard
          method="GET"
          path="/api/v1/auth/me"
          auth="AUTH"
          description="Get the currently authenticated user's profile (requires Bearer token)"
          onExecute={() => apiRequest("/api/v1/auth/me", { method: "GET" })}
        />
      </div>
    </div>
  )
}
