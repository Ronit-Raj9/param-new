import type React from "react"
import type { Metadata } from "next"
import { StudentSidebar } from "@/components/layout/student-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { studentNavigation } from "@/config/navigation"

export const metadata: Metadata = {
  title: {
    default: "Student Portal",
    template: "%s | Student Portal | PARAM",
  },
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      <Topbar showNav={false} mobileNav={<MobileNav items={studentNavigation} />} />
      <div className="flex">
        <StudentSidebar className="hidden md:flex" />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-auto">{children}</main>
      </div>
    </div>
  )
}
