import Link from "next/link"
import { Home, Search } from "lucide-react"
import { buttonVariants } from "@/src/components/ui/button"

export default function PublicNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <Search className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Seite nicht gefunden</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link href="/" className={buttonVariants()}>
        <Home className="h-4 w-4" />
        Zur Startseite
      </Link>
    </div>
  )
}
