"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"

export function VerifySection() {
  const router = useRouter()
  const [token, setToken] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (token.trim()) {
      router.push(`/verify/${encodeURIComponent(token.trim())}`)
    }
  }

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-background">
      <div className="container max-w-xl px-4 sm:px-6 md:px-8 lg:px-10">
        <Card className="border border-primary/20 shadow-sm rounded-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold text-slate-900">Verify a Credential</CardTitle>
            <CardDescription className="text-slate-600">
              Enter a verification token or paste a share link to verify an academic credential
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Enter verification token or paste link..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="flex-1 rounded-md"
              />
              <Button type="submit" disabled={!token.trim()} className="rounded-md shadow-none">
                Verify Credential
              </Button>
            </form>
            <p className="mt-3 text-xs text-center text-slate-500">
              Verification tokens are provided by credential holders or found in share links
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
