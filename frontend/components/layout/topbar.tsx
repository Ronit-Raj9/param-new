"use client"

import type React from "react"

import Link from "next/link"
import { useAuth } from "@/providers/auth-provider"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/layout/user-menu"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface TopbarProps {
  showNav?: boolean
  mobileNav?: React.ReactNode
}

export function Topbar({ showNav = true, mobileNav }: TopbarProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex items-center gap-4">
          {mobileNav && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                {mobileNav}
              </SheetContent>
            </Sheet>
          )}
          <Logo />
        </div>

        {showNav && (
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link href="/docs" className="text-sm font-medium text-slate-600 hover:text-foreground transition-colors whitespace-nowrap">
              Documentation
            </Link>
            <Link
              href="/support"
              className="text-sm font-medium text-slate-600 hover:text-foreground transition-colors whitespace-nowrap"
            >
              Support
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-4">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated && user ? (
            <UserMenu user={user} />
          ) : (
            <Button asChild size="sm" className="rounded-md shadow-none text-xs sm:text-sm">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
