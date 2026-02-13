"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Package, DollarSign, TrendingUp, Users } from "lucide-react"

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
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Organic Cotton T-Shirt",
      category: "Clothing",
      price: 29.99,
      stock: 45,
      status: "active",
      sales: 127,
    },
    {
      id: "2",
      name: "Bamboo Toothbrush Set",
      category: "Personal Care",
      price: 12.99,
      stock: 23,
      status: "active",
      sales: 89,
    },
    {
      id: "3",
      name: "Recycled Yoga Mat",
      category: "Sports & Fitness",
      price: 45.0,
      stock: 0,
      status: "inactive",
      sales: 156,
    },
    {
      id: "4",
      name: "Solar Power Bank",
      category: "Electronics",
      price: 42.99,
      stock: 18,
      status: "active",
      sales: 92,
    },
  ])

  const handleAddProduct = () => {
    alert("Add new product functionality would be implemented here")
  }

  const handleEditProduct = (productId: string) => {
    alert(`Edit product ${productId} functionality would be implemented here`)
  }

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((product) => product.id !== productId))
    }
  }

  const totalProducts = products.length
  const totalSales = products.reduce((sum, product) => sum + product.sales, 0)
  const totalRevenue = products.reduce((sum, product) => sum + product.price * product.sales, 0)
  const lowStockProducts = products.filter((product) => product.stock < 10).length

  return (
    <div className="min-h-screen bg-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Seller Dashboard</h1>
          <p className="text-green-600">Manage your sustainable products and track your sales</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Products</p>
                <p className="text-2xl font-bold text-green-800">{totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-800">{totalSales}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-green-800">{lowStockProducts}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm border border-green-200">
          <div className="p-6 border-b border-green-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-green-800">Your Products</h2>
              <button
                onClick={handleAddProduct}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-green-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-green-800">{product.name}</div>
                          <div className="text-sm text-green-600">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stock < 10
                            ? "bg-red-100 text-red-800"
                            : product.stock < 20
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">{product.sales}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditProduct(product.id)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete product"
                        >
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
              <Package className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">No products yet</h3>
              <p className="text-green-600 mb-4">Start by adding your first sustainable product</p>
              <button
                onClick={handleAddProduct}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
