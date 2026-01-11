"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/layout/user-menu"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface TopbarProps {
  showNav?: boolean
  mobileNav?: React.ReactNode
}

export function Topbar({ showNav = true, mobileNav }: TopbarProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur transition-colors",
      isHomePage 
        ? "border-white/10 bg-slate-900/80 supports-[backdrop-filter]:bg-slate-900/70" 
        : "border-slate-200 bg-background/95 supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex items-center gap-4">
          {mobileNav && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("md:hidden", isHomePage && "text-white hover:bg-white/10")}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                {mobileNav}
              </SheetContent>
            </Sheet>
          )}
          <Logo variant={isHomePage ? "light" : "default"} />
        </div>

        {showNav && (
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link href="/docs" className={cn(
              "text-sm font-medium transition-colors whitespace-nowrap",
              isHomePage ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-foreground"
            )}>
              Documentation
            </Link>
            <Link
              href="/support"
              className={cn(
                "text-sm font-medium transition-colors whitespace-nowrap",
                isHomePage ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-foreground"
              )}
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
            <Button asChild size="sm" className={cn(
              "rounded-md shadow-none text-xs sm:text-sm",
              isHomePage && "bg-white text-slate-900 hover:bg-slate-100"
            )}>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
