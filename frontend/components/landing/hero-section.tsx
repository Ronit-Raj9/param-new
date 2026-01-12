"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/college.jpg"
          alt="College Campus"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/80" />
        {/* Additional decorative overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent mix-blend-overlay" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="container relative z-10 max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium mb-4 sm:mb-5">
            <div className="relative h-4 w-4 sm:h-5 sm:w-5 rounded-full overflow-hidden border border-white/50">
              <Image
                src="/logo.jpeg"
                alt="IIITM Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-white">Trusted by IIITM Gwalior</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-balance text-white px-4 sm:px-0 drop-shadow-lg">
            Your Academic Credentials, <span className="text-primary bg-clip-text bg-gradient-to-r from-primary to-blue-400">Verified & Secure</span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl mx-auto text-pretty leading-relaxed px-4 sm:px-0">
            Access your semester results, download degree certificates, and share verified credentials with employers -
            all in one secure platform.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-4 sm:px-0">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-md shadow-lg min-w-[140px] bg-primary hover:bg-primary/90">
              <Link href="/login?role=student">
                Student Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-md shadow-lg min-w-[140px] bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/login?role=admin">Staff Login</Link>
            </Button>
          </div>

          <div className="mt-8 sm:mt-10 max-w-md mx-auto px-4 sm:px-0">
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-3 sm:p-4 shadow-xl">
              <p className="text-xs sm:text-sm text-slate-200 mb-3">Have a verification link? Check it here:</p>
              <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Enter verification token..."
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="pl-10 rounded-md text-sm bg-white/90 border-white/30"
                  />
                </div>
                <Button type="submit" variant="secondary" className="rounded-md shadow-none w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100">
                  Verify
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 md:mt-14 pt-8 sm:pt-10 border-t border-white/20 px-4 sm:px-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {[
              { value: "500+", label: "Students" },
              { value: "1,000+", label: "Credentials" },
              { value: "100%", label: "Blockchain Verified" },
              { value: "24/7", label: "Available" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-300 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
