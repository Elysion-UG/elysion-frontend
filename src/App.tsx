"use client"

import { usePathname } from "next/navigation"
import { AuthProvider } from "./context/AuthContext"
import { CartProvider } from "./context/CartContext"
import { Toaster } from "sonner"
import SustainableShop from "./components/SustainableShop"
import ProductDetail from "./components/ProductDetail"
import ProducerPage from "./components/ProducerPage"
import Onboarding from "./components/Onboarding"
import EmailVerification from "./components/EmailVerification"
import ResetPassword from "./components/ResetPassword"
import PageLayout from "./components/PageLayout"
import Contact from "./components/Contact"
import About from "./components/About"
import SellerDashboard from "./components/SellerDashboard"
import Praeferenzen from "./components/Praeferenzen"
import Profil from "./components/Profil"
import AdminUsers from "./components/AdminUsers"
import AdminUserDetail from "./components/AdminUserDetail"
import AdminSellers from "./components/AdminSellers"
import AdminProducts from "./components/AdminProducts"
import AdminOrders from "./components/AdminOrders"
import AdminFinance from "./components/AdminFinance"
import AdminCertificates from "./components/AdminCertificates"
import SellerLogin from "./components/SellerLogin"
import AdminLogin from "./components/AdminLogin"
import AuthGuard from "./components/AuthGuard"
import BuyerGuard from "./components/BuyerGuard"
import Cart from "./components/Cart"
import Checkout from "./components/Checkout"
import Orders from "./components/Orders"
import OrderDetail from "./components/OrderDetail"

function App() {
  const currentPage = usePathname()

  const renderPage = () => {
    switch (currentPage) {
      case "/product":
        return (
          <PageLayout>
            <BuyerGuard>
              <ProductDetail />
            </BuyerGuard>
          </PageLayout>
        )
      case "/producer":
        return (
          <PageLayout>
            <BuyerGuard>
              <ProducerPage />
            </BuyerGuard>
          </PageLayout>
        )
      case "/onboarding":
        return (
          <PageLayout>
            <Onboarding />
          </PageLayout>
        )
      case "/verify-email":
        return (
          <PageLayout>
            <EmailVerification />
          </PageLayout>
        )
      case "/reset-password":
        return (
          <PageLayout>
            <ResetPassword />
          </PageLayout>
        )
      case "/contact":
        return (
          <PageLayout>
            <Contact />
          </PageLayout>
        )
      case "/about":
        return (
          <PageLayout>
            <About />
          </PageLayout>
        )
      case "/seller-dashboard":
        return (
          <PageLayout>
            <AuthGuard requiredRoles={["SELLER"]}>
              <SellerDashboard />
            </AuthGuard>
          </PageLayout>
        )
      case "/praeferenzen":
        return (
          <PageLayout>
            <BuyerGuard>
              <AuthGuard>
                <Praeferenzen />
              </AuthGuard>
            </BuyerGuard>
          </PageLayout>
        )
      case "/profil":
        return (
          <PageLayout>
            <AuthGuard>
              <Profil />
            </AuthGuard>
          </PageLayout>
        )
      case "/cart":
        return (
          <PageLayout>
            <BuyerGuard>
              <Cart />
            </BuyerGuard>
          </PageLayout>
        )
      case "/checkout":
        return (
          <PageLayout>
            <BuyerGuard>
              <AuthGuard>
                <Checkout />
              </AuthGuard>
            </BuyerGuard>
          </PageLayout>
        )
      case "/orders":
        return (
          <PageLayout>
            <BuyerGuard>
              <AuthGuard>
                <Orders />
              </AuthGuard>
            </BuyerGuard>
          </PageLayout>
        )
      case "/admin/users":
        return (
          <PageLayout>
            <AuthGuard requiredRoles={["ADMIN"]}>
              <AdminUsers />
            </AuthGuard>
          </PageLayout>
        )
      case "/admin/sellers":
        return (
          <PageLayout>
            <AuthGuard requiredRoles={["ADMIN"]}>
              <AdminSellers />
            </AuthGuard>
          </PageLayout>
        )
      case "/admin/products":
        return (
          <PageLayout>
            <AuthGuard requiredRoles={["ADMIN"]}>
              <AdminProducts />
            </AuthGuard>
          </PageLayout>
        )
      case "/admin/orders":
        return (
          <PageLayout>
            <AuthGuard requiredRoles={["ADMIN"]}>
              <AdminOrders />
            </AuthGuard>
          </PageLayout>
        )
      case "/admin/finance":
        return (
          <PageLayout>
            <AuthGuard requiredRoles={["ADMIN"]}>
              <AdminFinance />
            </AuthGuard>
          </PageLayout>
        )
      case "/admin/certificates":
        return (
          <PageLayout>
            <AuthGuard requiredRoles={["ADMIN"]}>
              <AdminCertificates />
            </AuthGuard>
          </PageLayout>
        )
      case "/login/seller":
        return <SellerLogin />
      case "/login/admin":
        return <AdminLogin />
      default: {
        // Handle /orders/:id
        if (currentPage.startsWith("/orders/")) {
          return (
            <PageLayout>
              <BuyerGuard>
                <AuthGuard>
                  <OrderDetail />
                </AuthGuard>
              </BuyerGuard>
            </PageLayout>
          )
        }
        // Handle /admin/users/:id
        if (currentPage.startsWith("/admin/users/")) {
          return (
            <PageLayout>
              <AuthGuard requiredRoles={["ADMIN"]}>
                <AdminUserDetail />
              </AuthGuard>
            </PageLayout>
          )
        }
        // Default: buyer shop homepage
        return (
          <PageLayout>
            <BuyerGuard>
              <SustainableShop />
            </BuyerGuard>
          </PageLayout>
        )
      }
    }
  }

  return (
    <AuthProvider>
      <CartProvider>
        <div className="App">
          {renderPage()}
          <Toaster position="bottom-right" richColors closeButton />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
