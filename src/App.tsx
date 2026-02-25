import "./styles/globals.css"
import { AuthProvider } from "./context/AuthContext"
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
import AuthGuard from "./components/AuthGuard"

function App() {
  const currentPage = window.location.pathname

  const renderPage = () => {
    switch (currentPage) {
      case "/product":
        return (
          <PageLayout>
            <ProductDetail />
          </PageLayout>
        )
      case "/producer":
        return (
          <PageLayout>
            <ProducerPage />
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
            <AuthGuard>
              <Praeferenzen />
            </AuthGuard>
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
      case "/admin/users":
        return (
          <PageLayout>
            <AuthGuard requiredRoles={["ADMIN"]}>
              <AdminUsers />
            </AuthGuard>
          </PageLayout>
        )
      default: {
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
        return (
          <PageLayout>
            <SustainableShop />
          </PageLayout>
        )
      }
    }
  }

  return (
    <AuthProvider>
      <div className="App">
        {renderPage()}
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    </AuthProvider>
  )
}

export default App
