import "./styles/globals.css"
import SustainableShop from "./components/SustainableShop"
import ProductDetail from "./components/ProductDetail"
import ProducerPage from "./components/ProducerPage"
import Onboarding from "./components/Onboarding"
import EmailVerification from "./components/EmailVerification"
import PageLayout from "./components/PageLayout"
import Contact from "./components/Contact"
import About from "./components/About"
import SellerDashboard from "./components/SellerDashboard"
import Praeferenzen from "./components/Praeferenzen"
import Profil from "./components/Profil"

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
            <SellerDashboard />
          </PageLayout>
        )
      case "/praeferenzen":
        return (
          <PageLayout>
            <Praeferenzen />
          </PageLayout>
        )
      case "/profil":
        return (
          <PageLayout>
            <Profil />
          </PageLayout>
        )
      case "/layout-example":
        return (
          <PageLayout>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Page Content Area</h2>
              <p className="text-slate-600">This is where you can add any components you want!</p>
            </div>
          </PageLayout>
        )
      default:
        return (
          <PageLayout>
            <SustainableShop />
          </PageLayout>
        )
    }
  }

  return <div className="App">{renderPage()}</div>
}

export default App
