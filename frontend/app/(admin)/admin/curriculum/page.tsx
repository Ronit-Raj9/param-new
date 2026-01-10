import type { Metadata } from "next"
import { CurriculumManagement } from "@/components/admin/curriculum-management"

export const metadata: Metadata = {
  title: "Curriculum Management | Admin",
  description: "Manage programs, courses, and curriculum structure",
}

export default function CurriculumPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Curriculum Management</h1>
        <p className="text-sm text-slate-600 mt-1">Manage academic programs, courses, and curriculum structure</p>
      </div>
      <CurriculumManagement />
    </div>
  )
}
