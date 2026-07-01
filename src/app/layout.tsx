import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/src/app/providers"
import NavbarShell from "@/src/components/layout/NavbarShell"
import { siteUrl } from "@/src/lib/seo"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

// Nonce-basierte CSP (src/middleware.ts) erfordert dynamisches Rendering:
// Statisch vorgerenderte Seiten entstehen zur Build-Zeit ohne Request-Nonce,
// deren Inline-Bootstrap-Scripts werden dann vom Browser blockiert und die
// Hydration startet nie (FE#23). Datenbeschaffung ist ohnehin client-seitig.
export const dynamic = "force-dynamic"

const SITE_NAME = "Elysion"
const SITE_DESCRIPTION = "Marktplatz für nachhaltig zertifizierte Produkte"

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "de_DE",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className="font-sans antialiased">
        <Providers>
          <NavbarShell>{children}</NavbarShell>
        </Providers>
      </body>
    </html>
  )
}
