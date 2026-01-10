import type React from "react"
import type { Metadata } from "next"
import { Logo } from "@/components/shared/logo"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Authentication",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="py-4 sm:py-6 px-4 sm:px-6">
        <div className="container">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-4 sm:py-6 px-4 sm:px-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>
          Need help?{" "}
          <Link href="/support" className="text-primary hover:underline">
            Contact Support
          </Link>
        </p>
      </footer>
    </div>
  )
}
