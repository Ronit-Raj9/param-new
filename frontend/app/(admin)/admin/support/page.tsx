import type { Metadata } from "next"
import { SupportTickets } from "@/components/admin/support-tickets"

export const metadata: Metadata = {
  title: "Support Tickets | Admin",
  description: "Manage student support requests and tickets",
}

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Support Tickets</h1>
        <p className="text-sm text-slate-600 mt-1">Manage and respond to student support requests</p>
      </div>
      <SupportTickets />
    </div>
  )
}
