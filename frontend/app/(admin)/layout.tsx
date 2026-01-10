import type React from "react"
import type { Metadata } from "next"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { adminNavigation } from "@/config/navigation"

export const metadata: Metadata = {
  title: {
    default: "Admin Portal",
    template: "%s | Admin Portal | PARAM",
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      <Topbar showNav={false} mobileNav={<MobileNav items={adminNavigation} />} />
      <div className="flex">
        <AdminSidebar className="hidden md:flex" />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-auto">{children}</main>
      </div>
    </div>
  )
}
