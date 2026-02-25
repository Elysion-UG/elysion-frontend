"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Package, DollarSign, TrendingUp, Users, AlertTriangle, Clock } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { toast } from "sonner"

type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: "active" | "inactive"
  sales: number
}

export default function SellerDashboard() {
  const { sellerStatus } = useAuth()
  const [products, setProducts] = useState<Product[]>([
    { id: "1", name: "Organic Cotton T-Shirt", category: "Clothing", price: 29.99, stock: 45, status: "active", sales: 127 },
    { id: "2", name: "Bamboo Toothbrush Set", category: "Personal Care", price: 12.99, stock: 23, status: "active", sales: 89 },
    { id: "3", name: "Recycled Yoga Mat", category: "Sports & Fitness", price: 45.0, stock: 0, status: "inactive", sales: 156 },
    { id: "4", name: "Solar Power Bank", category: "Electronics", price: 42.99, stock: 18, status: "active", sales: 92 },
  ])

  const isApproved = sellerStatus === "APPROVED"

  const handleAddProduct = () => {
    if (!isApproved) return
    toast.info("Produkterstellung wird geladen...")
  }

  const handleEditProduct = (productId: string) => {
    if (!isApproved) return
    toast.info(`Produkt ${productId} wird bearbeitet...`)
  }

  const handleDeleteProduct = (productId: string) => {
    if (!isApproved) return
    setProducts(products.filter((p) => p.id !== productId))
    toast.success("Produkt gelöscht.")
  }

  const totalProducts = products.length
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0)
  const totalRevenue = products.reduce((sum, p) => sum + p.price * p.sales, 0)
  const lowStockProducts = products.filter((p) => p.stock < 10).length

  return (
    <div>
      {/* Seller approval banner */}
      {sellerStatus === "PENDING" && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">Verkäuferkonto wird geprüft</h3>
            <p className="text-sm text-amber-700 mt-1">
              Ihr Verkäuferkonto wartet auf Genehmigung durch einen Administrator. Solange Ihr Konto nicht genehmigt ist, können Sie keine Produkte verwalten.
            </p>
          </div>
        </div>
      )}

      {sellerStatus === "REJECTED" && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Verkäuferkonto abgelehnt</h3>
            <p className="text-sm text-red-700 mt-1">
              Ihr Antrag als Verkäufer wurde abgelehnt. Bitte kontaktieren Sie den Support für weitere Informationen.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Verkäufer Dashboard</h1>
        <p className="text-slate-600">Verwalten Sie Ihre nachhaltigen Produkte und verfolgen Sie Ihre Verkäufe.</p>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${!isApproved ? "opacity-50 pointer-events-none" : ""}`}>
        {[
          { label: "Produkte", value: totalProducts, icon: Package },
          { label: "Verkäufe", value: totalSales, icon: TrendingUp },
          { label: "Umsatz", value: `€${totalRevenue.toFixed(2)}`, icon: DollarSign },
          { label: "Niedriger Bestand", value: lowStockProducts, icon: Users },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-teal-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Products Table */}
      <div className={`bg-white rounded-xl border border-slate-200 ${!isApproved ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Ihre Produkte</h2>
          <button
            onClick={handleAddProduct}
            disabled={!isApproved}
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Neues Produkt
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Produkt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Preis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bestand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Verkäufe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                        <Package className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{product.name}</div>
                        <div className="text-xs text-slate-500">ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">€{product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      product.stock < 10 ? "bg-red-100 text-red-700"
                      : product.stock < 20 ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                    }`}>{product.stock} Stk.</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{product.sales}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}>{product.status === "active" ? "Aktiv" : "Inaktiv"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditProduct(product.id)} className="text-teal-600 hover:text-teal-800" title="Bearbeiten">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-700" title="Löschen">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Produkte</h3>
            <p className="text-slate-600 mb-4">Fügen Sie Ihr erstes nachhaltiges Produkt hinzu.</p>
          </div>
        )}
      </div>
    </div>
  )
}
