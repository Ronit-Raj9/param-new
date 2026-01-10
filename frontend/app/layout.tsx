import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/providers/auth-provider"
import { QueryProvider } from "@/providers/query-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Disable static generation for all pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: "PARAM - Academic Credential Management",
    template: "%s | PARAM",
  },
  description:
    "Secure academic credential management system for IIITM Gwalior. Access verified semester results, degree certificates, and share credentials with employers.",
  keywords: ["academic credentials", "IIITM Gwalior", "semester results", "degree verification", "transcript"],
  authors: [{ name: "IIITM Gwalior" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "PARAM",
    title: "PARAM - Academic Credential Management",
    description: "Secure academic credential management system for IIITM Gwalior",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#0b3d91",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased overflow-x-hidden`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
