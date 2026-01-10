"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, ArrowRight, Search } from "lucide-react"

export function HeroSection() {
  const router = useRouter()
  const [verifyToken, setVerifyToken] = useState("")

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (verifyToken.trim()) {
      router.push(`/verify/${encodeURIComponent(verifyToken.trim())}`)
    }
  }

  return (
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-slate-50/50">
      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-background px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium mb-4 sm:mb-5">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-slate-700">Trusted by IIITM Gwalior</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-balance text-slate-900 px-4 sm:px-0">
            Your Academic Credentials, <span className="text-primary">Verified & Secure</span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto text-pretty leading-relaxed px-4 sm:px-0">
            Access your semester results, download degree certificates, and share verified credentials with employers -
            all in one secure platform.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-4 sm:px-0">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-md shadow-none min-w-[140px]">
              <Link href="/login?role=student">
                Student Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-md bg-transparent shadow-none min-w-[140px]"
            >
              <Link href="/login?role=admin">Staff Login</Link>
            </Button>
          </div>

          <div className="mt-8 sm:mt-10 max-w-md mx-auto px-4 sm:px-0">
            <div className="rounded-xl border border-slate-200 bg-background p-3 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-slate-500 mb-3">Have a verification link? Check it here:</p>
              <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Enter verification token..."
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="pl-10 rounded-md text-sm"
                  />
                </div>
                <Button type="submit" variant="secondary" className="rounded-md shadow-none w-full sm:w-auto">
                  Verify
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 md:mt-14 pt-8 sm:pt-10 border-t border-slate-200 px-4 sm:px-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {[
              { value: "10,000+", label: "Students" },
              { value: "50,000+", label: "Credentials Issued" },
              { value: "100%", label: "Verified" },
              { value: "24/7", label: "Available" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
