"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const MC: Record<string, string> = { GET: "bg-blue-100 text-blue-800", POST: "bg-green-100 text-green-800", PATCH: "bg-yellow-100 text-yellow-800", DELETE: "bg-red-100 text-red-800", PUT: "bg-purple-100 text-purple-800" }

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

export default function DevUserPage() {
  const [token, setToken] = useState("")

  // Me
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")

  // Profile (Werteprofil)
  const [profileType, setProfileType] = useState("none")
  const [simpleProfile, setSimpleProfile] = useState('{"categories":[]}')
  const [extendedProfile, setExtendedProfile] = useState('{}')

  // Address
  const [addrType, setAddrType] = useState("SHIPPING")
  const [addrFirst, setAddrFirst] = useState("")
  const [addrLast, setAddrLast] = useState("")
  const [addrStreet, setAddrStreet] = useState("")
  const [addrHouse, setAddrHouse] = useState("")
  const [addrPostal, setAddrPostal] = useState("")
  const [addrCity, setAddrCity] = useState("")
  const [addrCountry, setAddrCountry] = useState("DE")
  const [addrDefault, setAddrDefault] = useState(false)
  const [addrId, setAddrId] = useState("")

  // Seller profile
  const [companyName, setCompanyName] = useState("")
  const [vatId, setVatId] = useState("")
  const [iban, setIban] = useState("")

  // Seller value profile
  const [svpLevel, setSvpLevel] = useState("STANDARD")
  const [svpPayload, setSvpPayload] = useState("{}")
  const [svpScore, setSvpScore] = useState("0")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">User & Profile API Test</h1>
        <p className="text-sm text-slate-500 mb-6">User-Info, Werteprofil, Adressen, Seller-Profil</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bearer Token</CardTitle></CardHeader>
          <CardContent>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGci..." className="font-mono text-xs bg-white" />
          </CardContent>
        </Card>

        <Tabs defaultValue="me">
          <TabsList className="mb-4">
            <TabsTrigger value="me">User</TabsTrigger>
            <TabsTrigger value="profile">Werteprofil</TabsTrigger>
            <TabsTrigger value="addresses">Adressen</TabsTrigger>
            <TabsTrigger value="seller">Seller Profil</TabsTrigger>
            <TabsTrigger value="svp">Seller Value</TabsTrigger>
          </TabsList>

          <TabsContent value="me">
            <EC method="GET" path="/api/v1/users/me" auth="AUTH" description="Eingeloggten Benutzer abrufen" onExecute={() => call("GET", "/api/v1/users/me", undefined, token)} />
            <EC method="PATCH" path="/api/v1/users/me" auth="AUTH" description="Eigenes Profil aktualisieren" onExecute={() => call("PATCH", "/api/v1/users/me", { ...(firstName ? { firstName } : {}), ...(lastName ? { lastName } : {}), ...(phone ? { phone } : {}) }, token)}>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Vorname</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Nachname</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Telefon</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="h-8 text-xs" /></div>
              </div>
            </EC>
            <EC method="DELETE" path="/api/v1/users/me" auth="AUTH" description="Account löschen (GDPR Soft-Delete)" onExecute={() => call("DELETE", "/api/v1/users/me", undefined, token)} />
          </TabsContent>

          <TabsContent value="profile">
            <EC method="GET" path="/api/v1/users/me/profile" auth="AUTH" description="Werteprofil abrufen (simpleProfile / extendedProfile)" onExecute={() => call("GET", "/api/v1/users/me/profile", undefined, token)} />
            <EC method="PUT" path="/api/v1/users/me/profile" auth="AUTH" description="Werteprofil speichern (vollständig ersetzen)" onExecute={() => {
              let sp, ep
              try { sp = JSON.parse(simpleProfile) } catch { sp = {} }
              try { ep = JSON.parse(extendedProfile) } catch { ep = {} }
              return call("PUT", "/api/v1/users/me/profile", { activeProfileType: profileType, simpleProfile: sp, extendedProfile: ep }, token)
            }}>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Profil-Typ</Label>
                  <Select value={profileType} onValueChange={setProfileType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">none</SelectItem><SelectItem value="simple">simple</SelectItem><SelectItem value="extended">extended</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">simpleProfile (JSON)</Label><Textarea value={simpleProfile} onChange={e => setSimpleProfile(e.target.value)} className="text-xs h-20" /></div>
                <div><Label className="text-xs">extendedProfile (JSON)</Label><Textarea value={extendedProfile} onChange={e => setExtendedProfile(e.target.value)} className="text-xs h-20" /></div>
              </div>
            </EC>
          </TabsContent>

          <TabsContent value="addresses">
            <EC method="GET" path="/api/v1/users/me/addresses" auth="AUTH" description="Alle Adressen des Benutzers" onExecute={() => call("GET", "/api/v1/users/me/addresses", undefined, token)} />
            <EC method="POST" path="/api/v1/users/me/addresses" auth="AUTH" description="Neue Adresse hinzufügen" onExecute={() => call("POST", "/api/v1/users/me/addresses", { type: addrType, firstName: addrFirst, lastName: addrLast, street: addrStreet, houseNumber: addrHouse, postalCode: addrPostal, city: addrCity, country: addrCountry, isDefault: addrDefault }, token)}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Typ</Label>
                  <Select value={addrType} onValueChange={setAddrType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="SHIPPING">SHIPPING</SelectItem><SelectItem value="BILLING">BILLING</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2"><Checkbox checked={addrDefault} onCheckedChange={v => setAddrDefault(!!v)} /><Label className="text-xs">Standard-Adresse</Label></div>
                <div><Label className="text-xs">Vorname</Label><Input value={addrFirst} onChange={e => setAddrFirst(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Nachname</Label><Input value={addrLast} onChange={e => setAddrLast(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Straße</Label><Input value={addrStreet} onChange={e => setAddrStreet(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Hausnummer</Label><Input value={addrHouse} onChange={e => setAddrHouse(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">PLZ</Label><Input value={addrPostal} onChange={e => setAddrPostal(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Stadt</Label><Input value={addrCity} onChange={e => setAddrCity(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Land</Label><Input value={addrCountry} onChange={e => setAddrCountry(e.target.value)} className="h-8 text-xs" /></div>
              </div>
            </EC>
            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Adress-ID (für PATCH / DELETE / set-default)</Label>
                <Input value={addrId} onChange={e => setAddrId(e.target.value)} placeholder="UUID der Adresse" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>
            <EC method="PATCH" path="/api/v1/users/me/addresses/{id}" auth="AUTH" description="Adresse aktualisieren" onExecute={() => call("PATCH", `/api/v1/users/me/addresses/${addrId}`, { ...(addrCity ? { city: addrCity } : {}), ...(addrPostal ? { postalCode: addrPostal } : {}) }, token)} />
            <EC method="PATCH" path="/api/v1/users/me/addresses/{id}/default" auth="AUTH" description="Als Standard-Adresse setzen" onExecute={() => call("PATCH", `/api/v1/users/me/addresses/${addrId}/default`, {}, token)} />
            <EC method="DELETE" path="/api/v1/users/me/addresses/{id}" auth="AUTH" description="Adresse löschen" onExecute={() => call("DELETE", `/api/v1/users/me/addresses/${addrId}`, undefined, token)} />
          </TabsContent>

          <TabsContent value="seller">
            <EC method="GET" path="/api/v1/users/me/seller-profile" auth="SELLER" description="Eigenes Seller-Profil abrufen" onExecute={() => call("GET", "/api/v1/users/me/seller-profile", undefined, token)} />
            <EC method="PATCH" path="/api/v1/users/me/seller-profile" auth="SELLER" description="Seller-Profil aktualisieren" onExecute={() => call("PATCH", "/api/v1/users/me/seller-profile", { ...(companyName ? { companyName } : {}), ...(vatId ? { vatId } : {}), ...(iban ? { iban } : {}) }, token)}>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Firmenname</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">USt-IdNr.</Label><Input value={vatId} onChange={e => setVatId(e.target.value)} placeholder="DE123456789" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">IBAN</Label><Input value={iban} onChange={e => setIban(e.target.value)} placeholder="DE89370400440532013000" className="h-8 text-xs" /></div>
              </div>
            </EC>
          </TabsContent>

          <TabsContent value="svp">
            <EC method="GET" path="/api/v1/users/me/seller/value-profile" auth="SELLER" description="Seller-Werteprofil abrufen" onExecute={() => call("GET", "/api/v1/users/me/seller/value-profile", undefined, token)} />
            <EC method="PUT" path="/api/v1/users/me/seller/value-profile" auth="SELLER" description="Seller-Werteprofil speichern" onExecute={() => {
              let payload
              try { payload = JSON.parse(svpPayload) } catch { payload = {} }
              return call("PUT", "/api/v1/users/me/seller/value-profile", { level: svpLevel, payload, score: parseFloat(svpScore) || 0 }, token)
            }}>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Level</Label>
                  <Select value={svpLevel} onValueChange={setSvpLevel}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="STANDARD">STANDARD</SelectItem><SelectItem value="LEVEL_2">LEVEL_2</SelectItem><SelectItem value="LEVEL_3">LEVEL_3</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Score</Label><Input type="number" value={svpScore} onChange={e => setSvpScore(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Payload (JSON)</Label><Textarea value={svpPayload} onChange={e => setSvpPayload(e.target.value)} className="text-xs h-20" /></div>
              </div>
            </EC>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
