import type React from "react"
import type { Metadata } from "next"
import {
  Newsreader,
  Schibsted_Grotesk,
  Bricolage_Grotesque,
  Hanken_Grotesk,
  Spline_Sans_Mono,
} from "next/font/google"
import "./globals.css"
import { Providers } from "@/src/app/providers"
import NavbarShell from "@/src/components/layout/NavbarShell"
import { siteUrl } from "@/src/lib/seo"

// Elysion Website Design System v1.3 — drei Stimmen (Guide 01):
// Newsreader (Display/H1), Schibsted Grotesk (H2/H3), Bricolage Grotesque (Body/UI).
// Hanken Grotesk als Eyebrow-/Fallback-Stimme, Spline Sans Mono für Mono-Captions.
const fontDisplay = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-display",
})
const fontHeading = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-heading",
})
const fontBody = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-body",
})
const fontEyebrow = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-eyebrow",
})
const fontMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
})

const fontVariables = [
  fontDisplay.variable,
  fontHeading.variable,
  fontBody.variable,
  fontEyebrow.variable,
  fontMono.variable,
].join(" ")

// Kein globales `force-dynamic` mehr (#37): der Root-Layout zwang bisher JEDE
// Route ins Per-Request-SSR, nur damit die nonce-basierte CSP griff. Stattdessen
// ist die Nonce jetzt routen-abhängig (src/middleware.ts): die authentifizierten
// Segmente (auth)/(admin)/(seller)/(buyer) setzen `force-dynamic` lokal und
// behalten die strikte Nonce-CSP; die (public)-Routen bekommen eine nonce-freie
// CSP und dürfen so statisch/ISR ausgeliefert werden (TTFB/SEO/CDN).

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
    <html lang="de" className={fontVariables}>
      <body className="font-sans antialiased">
        <Providers>
          <NavbarShell>{children}</NavbarShell>
        </Providers>
      </body>
    </html>
  )
}
