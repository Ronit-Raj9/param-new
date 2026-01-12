"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { adminNavigation, type NavItem } from "@/config/navigation"
import { ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { useApi } from "@/hooks/use-api"

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const api = useApi()
  const [openItems, setOpenItems] = useState<string[]>([])
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({})

  // Fetch badge counts from API
  useEffect(() => {
    if (!api.isReady) return

    async function fetchBadgeCounts() {
      try {
        const data = await api.get<{ success: boolean; data: Record<string, number> }>("/v1/dashboard/admin/counts")
        if (data.success) {
          setBadgeCounts(data.data || {})
        }
      } catch (err) {
        console.error("Error fetching badge counts:", err)
      }
    }

    fetchBadgeCounts()
  }, [api.isReady])

  const toggleItem = (href: string) => {
    setOpenItems((prev) => (prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]))
  }

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openItems.includes(item.href)
    const badgeCount = badgeCounts[item.href]

    if (hasChildren) {
      return (
        <Collapsible key={item.href} open={isOpen} onOpenChange={() => toggleItem(item.href)}>
          <CollapsibleTrigger
            className={cn(
              "flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              {item.title}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-8 space-y-1 mt-1">
            {item.children!.map((child) => {
              const childIsActive = pathname === child.href
              const childBadgeCount = badgeCounts[child.href]
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    childIsActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span>{child.title}</span>
                  {childBadgeCount && (
                    <Badge variant="secondary" className="h-5 min-w-5 flex items-center justify-center text-xs">
                      {childBadgeCount}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-5 w-5" />
          {item.title}
        </div>
        {badgeCount && (
          <Badge
            variant={isActive ? "outline" : "secondary"}
            className={cn(
              "h-5 min-w-5 flex items-center justify-center text-xs",
              isActive && "border-primary-foreground text-primary-foreground",
            )}
          >
            {badgeCount}
          </Badge>
        )}
      </Link>
    )
  }

  return (
    <aside className={cn("w-64 border-r bg-background h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto", className)}>
      <nav className="p-4 space-y-1">{adminNavigation.map(renderNavItem)}</nav>
    </aside>
  )
}
