"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { studentNavigation } from "@/config/navigation"

interface StudentSidebarProps {
  className?: string
}

export function StudentSidebar({ className }: StudentSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn("w-64 border-r bg-background h-[calc(100vh-4rem)] sticky top-16", className)}>
      <nav className="p-4 space-y-1">
        {studentNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
