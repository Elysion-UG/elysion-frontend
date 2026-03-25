"use client"

import { useState, useRef } from "react"
import { Toaster, toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { apiRequest, apiUpload } from "@/src/lib/api-client"

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
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

  const execute = async () => {
    setLoading(true)
    try {
      const res = await onExecute()
      setResponse(res)
      toast.success("OK")
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
          <span className="text-slate-700 break-all">{path}</span>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">{auth}</span>
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
          <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default function DevProductsPage() {
  // 1. List products
  const [listPage, setListPage] = useState("0")
  const [listSize, setListSize] = useState("20")
  const [listCategory, setListCategory] = useState("")
  const [listSearch, setListSearch] = useState("")

  // 2. Create product
  const [createTitle, setCreateTitle] = useState("")
  const [createDesc, setCreateDesc] = useState("")
  const [createPrice, setCreatePrice] = useState("29.99")
  const [createCurrency, setCreateCurrency] = useState("EUR")
  const [createCategoryId, setCreateCategoryId] = useState("")
  const [createTaxRate, setCreateTaxRate] = useState("1900")

  // 3. Get by slug
  const [slug, setSlug] = useState("")

  // 4. Update product
  const [updateId, setUpdateId] = useState("")
  const [updateTitle, setUpdateTitle] = useState("")
  const [updateDesc, setUpdateDesc] = useState("")
  const [updatePrice, setUpdatePrice] = useState("")

  // 5. Change status
  const [statusId, setStatusId] = useState("")
  const [status, setStatus] = useState("DRAFT")

  // 6. Upload image
  const [imgUploadId, setImgUploadId] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // 7. Delete image
  const [delImgProductId, setDelImgProductId] = useState("")
  const [delImageId, setDelImageId] = useState("")

  // 8. Reorder images
  const [reorderProductId, setReorderProductId] = useState("")
  const [reorderImageIds, setReorderImageIds] = useState('["uuid1","uuid2"]')

  // 9. Add variant
  const [varProductId, setVarProductId] = useState("")
  const [varSku, setVarSku] = useState("")
  const [varName, setVarName] = useState("")
  const [varPriceCents, setVarPriceCents] = useState("")
  const [varStock, setVarStock] = useState("10")
  const [varAttributes, setVarAttributes] = useState('{"size":"M"}')

  // 10. Update variant
  const [updVarProductId, setUpdVarProductId] = useState("")
  const [updVarId, setUpdVarId] = useState("")
  const [updVarSku, setUpdVarSku] = useState("")
  const [updVarName, setUpdVarName] = useState("")
  const [updVarPriceCents, setUpdVarPriceCents] = useState("")
  const [updVarStock, setUpdVarStock] = useState("")

  // 11. Delete variant
  const [delVarProductId, setDelVarProductId] = useState("")
  const [delVarId, setDelVarId] = useState("")

  // 12. List certificates
  const [certProductId, setCertProductId] = useState("")

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dev" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dev Index
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Products API Test</h1>
        <p className="text-sm text-slate-500 mb-8">Product CRUD, status, images, variants, certificates</p>

        {/* ── Products CRUD ─────────────────────────────────── */}
        <h2 className="text-base font-semibold text-slate-700 mb-3 mt-2">Products CRUD</h2>

        {/* 1. List products */}
        <EndpointCard
          method="GET" path="/api/v1/products" auth="PUBLIC"
          description="List products. Returns Spring Page: { content[], totalElements, totalPages, size, number }"
          onExecute={() => {
            const params = new URLSearchParams()
            params.set("page", listPage)
            params.set("size", listSize)
            if (listCategory) params.set("category", listCategory)
            if (listSearch) params.set("search", listSearch)
            return apiRequest(`/api/v1/products?${params}`)
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">page</Label><Input type="number" value={listPage} onChange={e => setListPage(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">size</Label><Input type="number" value={listSize} onChange={e => setListSize(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">category</Label><Input value={listCategory} onChange={e => setListCategory(e.target.value)} placeholder="(optional)" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">search</Label><Input value={listSearch} onChange={e => setListSearch(e.target.value)} placeholder="(optional)" className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        {/* 2. Create product */}
        <EndpointCard
          method="POST" path="/api/v1/products" auth="AUTH/SELLER"
          description="Create a new product. Price in euros is converted to cents (×100)."
          onExecute={() => apiRequest("/api/v1/products", {
            method: "POST",
            body: JSON.stringify({
              title: createTitle,
              description: createDesc,
              basePriceCents: Math.round(parseFloat(createPrice) * 100),
              currency: createCurrency || "EUR",
              categoryId: createCategoryId,
              taxRateBps: parseInt(createTaxRate) || 1900,
            }),
          })}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">title</Label><Input value={createTitle} onChange={e => setCreateTitle(e.target.value)} placeholder="Organic Cotton T-Shirt" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">categoryId</Label><Input value={createCategoryId} onChange={e => setCreateCategoryId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">basePrice (EUR, e.g. 29.99)</Label><Input type="number" value={createPrice} onChange={e => setCreatePrice(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">currency</Label><Input value={createCurrency} onChange={e => setCreateCurrency(e.target.value)} placeholder="EUR" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">taxRateBps (e.g. 1900 for 19%)</Label><Input type="number" value={createTaxRate} onChange={e => setCreateTaxRate(e.target.value)} className="h-8 text-xs" /></div>
            <div className="col-span-2"><Label className="text-xs">description</Label><Textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)} className="text-xs h-16" /></div>
          </div>
        </EndpointCard>

        {/* 3. Get by slug */}
        <EndpointCard
          method="GET" path="/api/v1/products/{slug}" auth="PUBLIC"
          description="Get a product by its slug."
          onExecute={() => apiRequest(`/api/v1/products/${slug}`)}
        >
          <div><Label className="text-xs">slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="organic-cotton-t-shirt" className="h-8 text-xs" /></div>
        </EndpointCard>

        {/* 4. Update product */}
        <EndpointCard
          method="PATCH" path="/api/v1/products/{id}" auth="AUTH/SELLER"
          description="Update product fields. Only provided fields are updated."
          onExecute={() => {
            const body: Record<string, unknown> = {}
            if (updateTitle) body.title = updateTitle
            if (updateDesc) body.description = updateDesc
            if (updatePrice) body.basePriceCents = Math.round(parseFloat(updatePrice) * 100)
            return apiRequest(`/api/v1/products/${updateId}`, { method: "PATCH", body: JSON.stringify(body) })
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">id</Label><Input value={updateId} onChange={e => setUpdateId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">title (optional)</Label><Input value={updateTitle} onChange={e => setUpdateTitle(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">basePrice EUR (optional)</Label><Input type="number" value={updatePrice} onChange={e => setUpdatePrice(e.target.value)} placeholder="29.99" className="h-8 text-xs" /></div>
            <div className="col-span-2"><Label className="text-xs">description (optional)</Label><Textarea value={updateDesc} onChange={e => setUpdateDesc(e.target.value)} className="text-xs h-16" /></div>
          </div>
        </EndpointCard>

        {/* 5. Change status */}
        <EndpointCard
          method="PATCH" path="/api/v1/products/{id}/status" auth="AUTH/SELLER or ADMIN"
          description="Change product status. State machine: DRAFT→REVIEW→ACTIVE↔INACTIVE."
          onExecute={() => apiRequest(`/api/v1/products/${statusId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          })}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">id</Label><Input value={statusId} onChange={e => setStatusId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div>
              <Label className="text-xs">status</Label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="REVIEW">REVIEW</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>
        </EndpointCard>

        {/* ── Product Images ─────────────────────────────────── */}
        <h2 className="text-base font-semibold text-slate-700 mb-3 mt-6">Product Images</h2>

        {/* 6. Upload image */}
        <EndpointCard
          method="POST" path="/api/v1/products/{id}/images" auth="AUTH/SELLER"
          description="Upload a product image (multipart/form-data)."
          onExecute={() => {
            const fd = new FormData()
            if (fileRef.current?.files?.[0]) {
              fd.append("file", fileRef.current.files[0])
            }
            return apiUpload(`/api/v1/products/${imgUploadId}/images`, fd)
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">id (product id)</Label><Input value={imgUploadId} onChange={e => setImgUploadId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div>
              <Label className="text-xs">file</Label>
              <input ref={fileRef} type="file" accept="image/*" className="w-full h-8 text-xs border border-slate-200 rounded px-2 py-1 bg-white" />
            </div>
          </div>
        </EndpointCard>

        {/* 7. Delete image */}
        <EndpointCard
          method="DELETE" path="/api/v1/products/{id}/images/{imageId}" auth="AUTH/SELLER"
          description="Delete a product image by ID."
          onExecute={() => apiRequest(`/api/v1/products/${delImgProductId}/images/${delImageId}`, { method: "DELETE" })}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">productId</Label><Input value={delImgProductId} onChange={e => setDelImgProductId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">imageId</Label><Input value={delImageId} onChange={e => setDelImageId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        {/* 8. Reorder images */}
        <EndpointCard
          method="PATCH" path="/api/v1/products/{id}/images/order" auth="AUTH/SELLER"
          description="Reorder product images by providing an ordered array of image IDs."
          onExecute={() => {
            let imageIds: string[] = []
            try { imageIds = JSON.parse(reorderImageIds) } catch { /* ignore */ }
            return apiRequest(`/api/v1/products/${reorderProductId}/images/order`, {
              method: "PATCH",
              body: JSON.stringify({ imageIds }),
            })
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">id (product id)</Label><Input value={reorderProductId} onChange={e => setReorderProductId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div className="col-span-2"><Label className="text-xs">imageIds (JSON array of UUIDs)</Label><Textarea value={reorderImageIds} onChange={e => setReorderImageIds(e.target.value)} className="text-xs h-16" /></div>
          </div>
        </EndpointCard>

        {/* ── Product Variants ─────────────────────────────────── */}
        <h2 className="text-base font-semibold text-slate-700 mb-3 mt-6">Product Variants</h2>

        {/* 9. Add variant */}
        <EndpointCard
          method="POST" path="/api/v1/products/{id}/variants" auth="AUTH/SELLER"
          description="Add a variant to a product. priceCents is optional (falls back to base price)."
          onExecute={() => {
            let attributes: Record<string, unknown> = {}
            try { attributes = JSON.parse(varAttributes) } catch { /* ignore */ }
            const body: Record<string, unknown> = {
              sku: varSku,
              name: varName,
              stock: parseInt(varStock) || 0,
              attributes,
            }
            if (varPriceCents) body.priceCents = parseInt(varPriceCents)
            return apiRequest(`/api/v1/products/${varProductId}/variants`, {
              method: "POST",
              body: JSON.stringify(body),
            })
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">id (product id)</Label><Input value={varProductId} onChange={e => setVarProductId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">sku</Label><Input value={varSku} onChange={e => setVarSku(e.target.value)} placeholder="SKU-001-M" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">name</Label><Input value={varName} onChange={e => setVarName(e.target.value)} placeholder="Size M" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">priceCents (optional)</Label><Input type="number" value={varPriceCents} onChange={e => setVarPriceCents(e.target.value)} placeholder="2999" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">stock</Label><Input type="number" value={varStock} onChange={e => setVarStock(e.target.value)} className="h-8 text-xs" /></div>
            <div className="col-span-2"><Label className="text-xs">attributes (JSON object)</Label><Textarea value={varAttributes} onChange={e => setVarAttributes(e.target.value)} className="text-xs h-16" /></div>
          </div>
        </EndpointCard>

        {/* 10. Update variant */}
        <EndpointCard
          method="PATCH" path="/api/v1/products/{id}/variants/{variantId}" auth="AUTH/SELLER"
          description="Update a product variant."
          onExecute={() => {
            const body: Record<string, unknown> = {}
            if (updVarSku) body.sku = updVarSku
            if (updVarName) body.name = updVarName
            if (updVarPriceCents) body.priceCents = parseInt(updVarPriceCents)
            if (updVarStock) body.stock = parseInt(updVarStock)
            return apiRequest(`/api/v1/products/${updVarProductId}/variants/${updVarId}`, {
              method: "PATCH",
              body: JSON.stringify(body),
            })
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">productId</Label><Input value={updVarProductId} onChange={e => setUpdVarProductId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">variantId</Label><Input value={updVarId} onChange={e => setUpdVarId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">sku</Label><Input value={updVarSku} onChange={e => setUpdVarSku(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">name</Label><Input value={updVarName} onChange={e => setUpdVarName(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">priceCents</Label><Input type="number" value={updVarPriceCents} onChange={e => setUpdVarPriceCents(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">stock</Label><Input type="number" value={updVarStock} onChange={e => setUpdVarStock(e.target.value)} className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        {/* 11. Delete variant */}
        <EndpointCard
          method="DELETE" path="/api/v1/products/{id}/variants/{variantId}" auth="AUTH/SELLER"
          description="Delete a product variant."
          onExecute={() => apiRequest(`/api/v1/products/${delVarProductId}/variants/${delVarId}`, { method: "DELETE" })}
        >
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">productId</Label><Input value={delVarProductId} onChange={e => setDelVarProductId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">variantId</Label><Input value={delVarId} onChange={e => setDelVarId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
          </div>
        </EndpointCard>

        {/* ── Product Certificates ─────────────────────────────────── */}
        <h2 className="text-base font-semibold text-slate-700 mb-3 mt-6">Product Certificates</h2>

        {/* 12. List certificates */}
        <EndpointCard
          method="GET" path="/api/v1/products/{id}/certificates" auth="PUBLIC"
          description="List certificates attached to a product."
          onExecute={() => apiRequest(`/api/v1/products/${certProductId}/certificates`)}
        >
          <div><Label className="text-xs">id (product id)</Label><Input value={certProductId} onChange={e => setCertProductId(e.target.value)} placeholder="UUID" className="h-8 text-xs" /></div>
        </EndpointCard>
      </div>
    </div>
  )
}
