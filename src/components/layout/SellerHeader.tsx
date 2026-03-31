"use client"

import { useAuth } from "@/src/context/AuthContext"
import { AuthService } from "@/src/services/auth.service"
import { useRouter } from "next/navigation"
import { LogOut, Store } from "lucide-react"
import { Button } from "@/src/components/ui/button"

export default function SellerHeader() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await AuthService.logout()
    router.push("/login/seller")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <Store className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Elysion{" "}
            <span className="font-normal text-slate-500 dark:text-slate-400">Seller Portal</span>
          </span>
        </div>

        {/* User + logout */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 dark:text-slate-400 sm:block">
              {user.firstName} {user.lastName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
