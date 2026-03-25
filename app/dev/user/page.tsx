"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { apiRequest, setAccessToken } from "@/src/lib/api-client"

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
  PUT: "bg-orange-100 text-orange-800",
  DELETE: "bg-red-100 text-red-800",
}

function EndpointCard({
  method, path, auth, description, children, onExecute,
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
      toast.success("Request sent")
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
          {loading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Execute
        </Button>
        {response !== null && (
          <pre className={`mt-2 p-3 border rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap ${isError ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200"}`}>
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default function DevUserPage() {
  const [token, setToken] = useState("")

  // User Me
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")

  // Value Profile
  const [activeProfileType, setActiveProfileType] = useState("NONE")
  const [simpleProfile, setSimpleProfile] = useState('{"categories":[]}')
  const [extendedProfile, setExtendedProfile] = useState("{}")

  // Addresses
  const [addrStreet, setAddrStreet] = useState("")
  const [addrCity, setAddrCity] = useState("")
  const [addrPostal, setAddrPostal] = useState("")
  const [addrCountry, setAddrCountry] = useState("DE")
  const [addrType, setAddrType] = useState("SHIPPING")
  const [addrDefault, setAddrDefault] = useState(false)
  const [addrId, setAddrId] = useState("")
  const [patchAddrStreet, setPatchAddrStreet] = useState("")
  const [patchAddrCity, setPatchAddrCity] = useState("")
  const [patchAddrPostal, setPatchAddrPostal] = useState("")
  const [patchAddrCountry, setPatchAddrCountry] = useState("")

  // Seller Profile
  const [companyName, setCompanyName] = useState("")
  const [vatId, setVatId] = useState("")
  const [description, setDescription] = useState("")
  const [website, setWebsite] = useState("")

  // Seller Value Profile
  const [svpLevel, setSvpLevel] = useState("STANDARD")
  const [certifications, setCertifications] = useState("[]")

  const [deleteConfirm, setDeleteConfirm] = useState("")

  const withToken = (fn: () => Promise<unknown>) => {
    setAccessToken(token || null)
    return fn()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dev Index
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">User & Profile API Test</h1>
        <p className="text-sm text-slate-500 mb-6">User info, value profile, addresses, seller profile</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bearer Token (for authenticated endpoints)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="eyJhbGci..."
              className="font-mono text-xs bg-white"
            />
          </CardContent>
        </Card>

        {/* User Me */}
        <h2 className="text-lg font-semibold text-slate-700 mb-3 mt-6">User Me</h2>

        <EndpointCard
          method="GET" path="/api/v1/users/me" auth="AUTH"
          description="Get current authenticated user profile"
          onExecute={() => withToken(() => apiRequest("/api/v1/users/me"))}
        />

        <EndpointCard
          method="PATCH" path="/api/v1/users/me" auth="AUTH"
          description="Update user first name, last name, or phone"
          onExecute={() => withToken(() => apiRequest("/api/v1/users/me", {
            method: "PATCH",
            body: JSON.stringify({
              ...(firstName ? { firstName } : {}),
              ...(lastName ? { lastName } : {}),
              ...(phone ? { phone } : {}),
            }),
          }))}
        >
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-xs">First Name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Phone (optional)</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        <EndpointCard
          method="DELETE" path="/api/v1/users/me" auth="AUTH"
          description='Delete account (GDPR soft-delete). Type "DELETE" to confirm.'
          onExecute={() => withToken(() => apiRequest("/api/v1/users/me", { method: "DELETE" }))}
        >
          <div>
            <Label className="text-xs text-red-600">Type DELETE to confirm</Label>
            <Input placeholder="DELETE" className="h-8 text-xs border-red-200" />
          </div>
        </EndpointCard>

        {/* Buyer Value Profile */}
        <h2 className="text-lg font-semibold text-slate-700 mb-3 mt-8">Buyer Value Profile</h2>

        <EndpointCard
          method="GET" path="/api/v1/users/me/profile" auth="AUTH"
          description="Get buyer value profile (simple / extended)"
          onExecute={() => withToken(() => apiRequest("/api/v1/users/me/profile"))}
        />

        <EndpointCard
          method="PUT" path="/api/v1/users/me/profile" auth="AUTH"
          description="Upsert buyer value profile (full replace)"
          onExecute={() => withToken(() => {
            let sp, ep
            try { sp = JSON.parse(simpleProfile) } catch { sp = {} }
            try { ep = JSON.parse(extendedProfile) } catch { ep = {} }
            return apiRequest("/api/v1/users/me/profile", {
              method: "PUT",
              body: JSON.stringify({ activeProfileType, simpleProfile: sp, extendedProfile: ep }),
            })
          })}
        >
          <div className="space-y-2">
            <div>
              <Label className="text-xs">activeProfileType</Label>
              <Select value={activeProfileType} onValueChange={setActiveProfileType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">NONE</SelectItem>
                  <SelectItem value="SIMPLE">SIMPLE</SelectItem>
                  <SelectItem value="EXTENDED">EXTENDED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">simpleProfile (JSON)</Label><Textarea value={simpleProfile} onChange={e => setSimpleProfile(e.target.value)} className="text-xs h-20" /></div>
            <div><Label className="text-xs">extendedProfile (JSON)</Label><Textarea value={extendedProfile} onChange={e => setExtendedProfile(e.target.value)} className="text-xs h-20" /></div>
          </div>
        </EndpointCard>

        {/* Addresses */}
        <h2 className="text-lg font-semibold text-slate-700 mb-3 mt-8">Addresses</h2>

        <EndpointCard
          method="GET" path="/api/v1/users/me/addresses" auth="AUTH"
          description="List all addresses for the current user"
          onExecute={() => withToken(() => apiRequest("/api/v1/users/me/addresses"))}
        />

        <EndpointCard
          method="POST" path="/api/v1/users/me/addresses" auth="AUTH"
          description="Create a new address"
          onExecute={() => withToken(() => apiRequest("/api/v1/users/me/addresses", {
            method: "POST",
            body: JSON.stringify({ street: addrStreet, city: addrCity, postalCode: addrPostal, country: addrCountry, addressType: addrType, isDefault: addrDefault }),
          }))}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Street</Label><Input value={addrStreet} onChange={e => setAddrStreet(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">City</Label><Input value={addrCity} onChange={e => setAddrCity(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Postal Code</Label><Input value={addrPostal} onChange={e => setAddrPostal(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Country</Label><Input value={addrCountry} onChange={e => setAddrCountry(e.target.value)} className="h-8 text-xs" /></div>
            <div>
              <Label className="text-xs">Address Type</Label>
              <Select value={addrType} onValueChange={setAddrType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHIPPING">SHIPPING</SelectItem>
                  <SelectItem value="BILLING">BILLING</SelectItem>
                  <SelectItem value="BOTH">BOTH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Checkbox id="addr-default" checked={addrDefault} onCheckedChange={v => setAddrDefault(!!v)} />
              <Label htmlFor="addr-default" className="text-xs">Is Default</Label>
            </div>
          </div>
        </EndpointCard>

        <Card className="mb-4 border-slate-200">
          <CardContent className="pt-4">
            <Label className="text-xs font-semibold">Address ID (for PATCH / DELETE / set-default)</Label>
            <Input value={addrId} onChange={e => setAddrId(e.target.value)} placeholder="UUID of the address" className="h-8 text-xs mt-1" />
          </CardContent>
        </Card>

        <EndpointCard
          method="PATCH" path="/api/v1/users/me/addresses/{id}" auth="AUTH"
          description="Update an existing address by ID"
          onExecute={() => withToken(() => apiRequest(`/api/v1/users/me/addresses/${addrId}`, {
            method: "PATCH",
            body: JSON.stringify({
              ...(patchAddrStreet ? { street: patchAddrStreet } : {}),
              ...(patchAddrCity ? { city: patchAddrCity } : {}),
              ...(patchAddrPostal ? { postalCode: patchAddrPostal } : {}),
              ...(patchAddrCountry ? { country: patchAddrCountry } : {}),
            }),
          }))}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Street</Label><Input value={patchAddrStreet} onChange={e => setPatchAddrStreet(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">City</Label><Input value={patchAddrCity} onChange={e => setPatchAddrCity(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Postal Code</Label><Input value={patchAddrPostal} onChange={e => setPatchAddrPostal(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Country</Label><Input value={patchAddrCountry} onChange={e => setPatchAddrCountry(e.target.value)} className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        <EndpointCard
          method="DELETE" path="/api/v1/users/me/addresses/{id}" auth="AUTH"
          description="Delete address by ID"
          onExecute={() => withToken(() => apiRequest(`/api/v1/users/me/addresses/${addrId}`, { method: "DELETE" }))}
        />

        <EndpointCard
          method="PATCH" path="/api/v1/users/me/addresses/{id}/default" auth="AUTH"
          description="Set address as default by ID"
          onExecute={() => withToken(() => apiRequest(`/api/v1/users/me/addresses/${addrId}/default`, { method: "PATCH" }))}
        />

        {/* Seller Profile */}
        <h2 className="text-lg font-semibold text-slate-700 mb-3 mt-8">Seller Profile</h2>

        <EndpointCard
          method="GET" path="/api/v1/users/me/seller-profile" auth="AUTH / SELLER"
          description="Get own seller profile"
          onExecute={() => withToken(() => apiRequest("/api/v1/users/me/seller-profile"))}
        />

        <EndpointCard
          method="PATCH" path="/api/v1/users/me/seller-profile" auth="AUTH / SELLER"
          description="Update seller profile"
          onExecute={() => withToken(() => apiRequest("/api/v1/users/me/seller-profile", {
            method: "PATCH",
            body: JSON.stringify({
              ...(companyName ? { companyName } : {}),
              ...(vatId ? { vatId } : {}),
              ...(description ? { description } : {}),
              ...(website ? { website } : {}),
            }),
          }))}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Company Name</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">VAT ID</Label><Input value={vatId} onChange={e => setVatId(e.target.value)} placeholder="DE123456789" className="h-8 text-xs" /></div>
            <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="text-xs h-16" /></div>
            <div className="col-span-2"><Label className="text-xs">Website</Label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        {/* Seller Value Profile */}
        <h2 className="text-lg font-semibold text-slate-700 mb-3 mt-8">Seller Value Profile</h2>

        <EndpointCard
          method="GET" path="/api/v1/users/me/seller/value-profile" auth="AUTH / SELLER"
          description="Get seller value profile"
          onExecute={() => withToken(() => apiRequest("/api/v1/users/me/seller/value-profile"))}
        />

        <EndpointCard
          method="PUT" path="/api/v1/users/me/seller/value-profile" auth="AUTH / SELLER"
          description="Update seller value profile"
          onExecute={() => withToken(() => {
            let certs
            try { certs = JSON.parse(certifications) } catch { certs = [] }
            return apiRequest("/api/v1/users/me/seller/value-profile", {
              method: "PUT",
              body: JSON.stringify({ level: svpLevel, certifications: certs }),
            })
          })}
        >
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Level</Label>
              <Select value={svpLevel} onValueChange={setSvpLevel}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">STANDARD</SelectItem>
                  <SelectItem value="LEVEL_2">LEVEL_2</SelectItem>
                  <SelectItem value="LEVEL_3">LEVEL_3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Certifications (JSON array)</Label><Textarea value={certifications} onChange={e => setCertifications(e.target.value)} className="text-xs h-20" /></div>
          </div>
        </EndpointCard>
      </div>
    </div>
  )
}
