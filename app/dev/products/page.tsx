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
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const MC: Record<string, string> = { GET: "bg-blue-100 text-blue-800", POST: "bg-green-100 text-green-800", PATCH: "bg-yellow-100 text-yellow-800", DELETE: "bg-red-100 text-red-800" }

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
          <span className="text-slate-700 break-all">{path}</span>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">{auth}</span>
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

export default function DevProductsPage() {
  const [token, setToken] = useState("")

  // List
  const [listSearch, setListSearch] = useState("")
  const [listCatId, setListCatId] = useState("")
  const [listSellerId, setListSellerId] = useState("")
  const [listSort, setListSort] = useState("NEWEST")
  const [listPage, setListPage] = useState("0")

  // Get by slug / id
  const [slug, setSlug] = useState("")
  const [productId, setProductId] = useState("")

  // Create / Update
  const [catId, setCatId] = useState("")
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [price, setPrice] = useState("29.99")
  const [taxRate, setTaxRate] = useState("19")
  const [status, setStatus] = useState("DRAFT")
  const [updateId, setUpdateId] = useState("")

  // Image
  const [imgProdId, setImgProdId] = useState("")
  const [imgUrl, setImgUrl] = useState("")
  const [imgAlt, setImgAlt] = useState("")
  const [imgOrder, setImgOrder] = useState("1")
  const [imgId, setImgId] = useState("")
  const [imgReorderJson, setImgReorderJson] = useState('[{"id":"uuid","order":1}]')

  // Variant
  const [varProdId, setVarProdId] = useState("")
  const [varId, setVarId] = useState("")
  const [varSku, setVarSku] = useState("")
  const [varPrice, setVarPrice] = useState("")
  const [varStock, setVarStock] = useState("10")
  const [varOptions, setVarOptions] = useState('[{"optionType":"SIZE","optionValue":"M"}]')

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Products API Test</h1>
        <p className="text-sm text-slate-500 mb-6">Produkt-CRUD, Status, Bilder, Varianten</p>

        <Card className="mb-6 border-teal-200 bg-teal-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bearer Token (SELLER für Schreib-Endpunkte)</CardTitle></CardHeader>
          <CardContent>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGci..." className="font-mono text-xs bg-white" />
          </CardContent>
        </Card>

        <Tabs defaultValue="read">
          <TabsList className="mb-4">
            <TabsTrigger value="read">Lesen</TabsTrigger>
            <TabsTrigger value="write">Verwalten</TabsTrigger>
            <TabsTrigger value="images">Bilder</TabsTrigger>
            <TabsTrigger value="variants">Varianten</TabsTrigger>
          </TabsList>

          <TabsContent value="read">
            <EC method="GET" path="/api/v1/products" auth="PUBLIC" description="Produktliste mit Suche, Filter, Sortierung und Paginierung"
              onExecute={() => {
                const params = new URLSearchParams({ page: listPage, size: "20", sort: listSort })
                if (listSearch) params.set("search", listSearch)
                if (listCatId) params.set("categoryId", listCatId)
                if (listSellerId) params.set("sellerId", listSellerId)
                return call("GET", `/api/v1/products?${params}`)
              }}>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Suche</Label><Input value={listSearch} onChange={e => setListSearch(e.target.value)} placeholder="Suchbegriff" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Kategorie-ID</Label><Input value={listCatId} onChange={e => setListCatId(e.target.value)} placeholder="UUID (optional)" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Seller-ID</Label><Input value={listSellerId} onChange={e => setListSellerId(e.target.value)} placeholder="UUID (optional)" className="h-8 text-xs" /></div>
                <div>
                  <Label className="text-xs">Sortierung</Label>
                  <Select value={listSort} onValueChange={setListSort}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="NEWEST">NEWEST</SelectItem><SelectItem value="PRICE_ASC">PRICE_ASC</SelectItem><SelectItem value="PRICE_DESC">PRICE_DESC</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Seite</Label><Input type="number" value={listPage} onChange={e => setListPage(e.target.value)} className="h-8 text-xs" /></div>
              </div>
            </EC>
            <EC method="GET" path="/api/v1/products/{slug}" auth="PUBLIC" description="Produkt per Slug abrufen"
              onExecute={() => call("GET", `/api/v1/products/${slug}`)}>
              <div><Label className="text-xs">Slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="organic-cotton-t-shirt" className="h-8 text-xs" /></div>
            </EC>
            <EC method="GET" path="/api/v1/products/{id}" auth="AUTH" description="Produkt per UUID abrufen"
              onExecute={() => call("GET", `/api/v1/products/${productId}`, undefined, token)}>
              <div><Label className="text-xs">Produkt-ID (UUID)</Label><Input value={productId} onChange={e => setProductId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            </EC>
            <EC method="GET" path="/api/v1/products/{id}/certificates" auth="PUBLIC" description="Öffentliche Zertifikate eines Produkts"
              onExecute={() => call("GET", `/api/v1/products/${productId}/certificates`)}>
              <p className="text-xs text-slate-500">Verwendet Produkt-ID von oben</p>
            </EC>
          </TabsContent>

          <TabsContent value="write">
            <EC method="POST" path="/api/v1/products" auth="SELLER" description="Neues Produkt erstellen (Preise in EUR werden zu Cent konvertiert)"
              onExecute={() => call("POST", "/api/v1/products", {
                categoryId: catId, name, description: desc,
                basePrice: Math.round(parseFloat(price) * 100),
                currency: "EUR",
                taxRate: parseInt(taxRate) * 100,
              }, token)}>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Kategorie-ID</Label><Input value={catId} onChange={e => setCatId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Bio-Baumwoll T-Shirt" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Preis (EUR, z.B. 29.99)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">MwSt % (z.B. 19)</Label><Input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="h-8 text-xs" /></div>
                <div className="col-span-2"><Label className="text-xs">Beschreibung</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} className="text-xs h-16" /></div>
              </div>
            </EC>
            <EC method="PATCH" path="/api/v1/products/{id}" auth="SELLER" description="Produkt aktualisieren"
              onExecute={() => call("PATCH", `/api/v1/products/${updateId}`, {
                ...(name ? { name } : {}),
                ...(price ? { basePrice: Math.round(parseFloat(price) * 100) } : {}),
              }, token)}>
              <div><Label className="text-xs">Produkt-ID</Label><Input value={updateId} onChange={e => setUpdateId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            </EC>
            <EC method="PATCH" path="/api/v1/products/{id}/status" auth="SELLER" description="Produkt-Status ändern (DRAFT→REVIEW→ACTIVE↔INACTIVE)"
              onExecute={() => call("PATCH", `/api/v1/products/${updateId}/status`, { status }, token)}>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Produkt-ID</Label><Input value={updateId} onChange={e => setUpdateId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
                <div>
                  <Label className="text-xs">Neuer Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="DRAFT">DRAFT</SelectItem><SelectItem value="REVIEW">REVIEW</SelectItem><SelectItem value="ACTIVE">ACTIVE</SelectItem><SelectItem value="INACTIVE">INACTIVE</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </EC>
          </TabsContent>

          <TabsContent value="images">
            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4">
                <Label className="text-xs font-semibold">Produkt-ID (für alle Bild-Endpunkte)</Label>
                <Input value={imgProdId} onChange={e => setImgProdId(e.target.value)} placeholder="UUID" className="h-8 text-xs mt-1" />
              </CardContent>
            </Card>
            <EC method="POST" path="/api/v1/products/{id}/images" auth="SELLER" description="Bild hinzufügen (URL zu vorab hochgeladener Datei)"
              onExecute={() => call("POST", `/api/v1/products/${imgProdId}/images`, { url: imgUrl, altText: imgAlt, order: parseInt(imgOrder) || 1 }, token)}>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2"><Label className="text-xs">Bild-URL (nach Upload /dev/files)</Label><Input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Alt-Text</Label><Input value={imgAlt} onChange={e => setImgAlt(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Reihenfolge</Label><Input type="number" value={imgOrder} onChange={e => setImgOrder(e.target.value)} className="h-8 text-xs" /></div>
              </div>
            </EC>
            <EC method="DELETE" path="/api/v1/products/{id}/images/{imageId}" auth="SELLER" description="Bild löschen"
              onExecute={() => call("DELETE", `/api/v1/products/${imgProdId}/images/${imgId}`, undefined, token)}>
              <div><Label className="text-xs">Bild-ID</Label><Input value={imgId} onChange={e => setImgId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            </EC>
            <EC method="PATCH" path="/api/v1/products/{id}/images/order" auth="SELLER" description="Bilder neu sortieren"
              onExecute={() => {
                let imgs
                try { imgs = JSON.parse(imgReorderJson) } catch { imgs = [] }
                return call("PATCH", `/api/v1/products/${imgProdId}/images/order`, { images: imgs }, token)
              }}>
              <div><Label className="text-xs">Bilder-Array (JSON)</Label><Textarea value={imgReorderJson} onChange={e => setImgReorderJson(e.target.value)} className="text-xs h-16" /></div>
            </EC>
          </TabsContent>

          <TabsContent value="variants">
            <Card className="mb-4 border-slate-200">
              <CardContent className="pt-4 grid grid-cols-2 gap-2">
                <div><Label className="text-xs font-semibold">Produkt-ID</Label><Input value={varProdId} onChange={e => setVarProdId(e.target.value)} placeholder="UUID" className="h-8 text-xs mt-1" /></div>
                <div><Label className="text-xs font-semibold">Varianten-ID (für PATCH/DELETE)</Label><Input value={varId} onChange={e => setVarId(e.target.value)} placeholder="UUID" className="h-8 text-xs mt-1" /></div>
              </CardContent>
            </Card>
            <EC method="POST" path="/api/v1/products/{id}/variants" auth="SELLER" description="Neue Variante hinzufügen (Preis in EUR, leer = Basispreis)"
              onExecute={() => {
                let opts
                try { opts = JSON.parse(varOptions) } catch { opts = [] }
                return call("POST", `/api/v1/products/${varProdId}/variants`, {
                  sku: varSku,
                  ...(varPrice ? { price: Math.round(parseFloat(varPrice) * 100) } : {}),
                  stock: parseInt(varStock) || 0,
                  options: opts,
                }, token)
              }}>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">SKU</Label><Input value={varSku} onChange={e => setVarSku(e.target.value)} placeholder="SKU-001-M" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Preis EUR (leer = Basispreis)</Label><Input type="number" value={varPrice} onChange={e => setVarPrice(e.target.value)} placeholder="29.99" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Lagerbestand</Label><Input type="number" value={varStock} onChange={e => setVarStock(e.target.value)} className="h-8 text-xs" /></div>
              </div>
              <div><Label className="text-xs">Optionen (JSON)</Label><Textarea value={varOptions} onChange={e => setVarOptions(e.target.value)} className="text-xs h-16" /></div>
            </EC>
            <EC method="PATCH" path="/api/v1/products/{id}/variants/{variantId}" auth="SELLER" description="Variante aktualisieren"
              onExecute={() => call("PATCH", `/api/v1/products/${varProdId}/variants/${varId}`, { ...(varSku ? { sku: varSku } : {}), ...(varStock ? { stock: parseInt(varStock) } : {}) }, token)} />
            <EC method="DELETE" path="/api/v1/products/{id}/variants/{variantId}" auth="SELLER" description="Variante löschen"
              onExecute={() => call("DELETE", `/api/v1/products/${varProdId}/variants/${varId}`, undefined, token)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
