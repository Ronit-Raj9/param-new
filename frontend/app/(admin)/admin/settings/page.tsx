import type { Metadata } from "next"
import { SystemSettings } from "@/components/admin/system-settings"

export const metadata: Metadata = {
  title: "System Settings | Admin",
  description: "Configure system settings and preferences",
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-600 mt-1">Configure system preferences, notifications, and integrations</p>
      </div>
      <SystemSettings />
    </div>
  )
}
