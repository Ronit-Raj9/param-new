import type React from "react"
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  Share2,
  User,
  Users,
  UserPlus,
  Upload,
  CheckSquare,
  Award,
  BookOpen,
  ScrollText,
  Settings,
  HelpCircle,
  Download,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: NavItem[]
}

export const studentNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/student",
    icon: LayoutDashboard,
  },
  {
    title: "My Results",
    href: "/student/results",
    icon: FileText,
  },
  {
    title: "Degree",
    href: "/student/degree",
    icon: GraduationCap,
  },
  {
    title: "Share Credentials",
    href: "/student/share",
    icon: Share2,
  },
  {
    title: "Profile",
    href: "/student/profile",
    icon: User,
  },
]

export const adminNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: UserPlus,
    children: [
      { title: "Student Registry", href: "/admin/students", icon: Users },
      { title: "Upload Students", href: "/admin/students/upload", icon: Upload },
    ],
  },
  {
    title: "Results",
    href: "/admin/results/upload",
    icon: FileText,
    children: [
      { title: "Add Results", href: "/admin/results/add", icon: FileText },
      { title: "Upload CSV", href: "/admin/results/upload", icon: Upload },
      { title: "Preview & Edit", href: "/admin/results/preview", icon: FileText },
    ],
  },
  {
    title: "Approvals",
    href: "/admin/approve",
    icon: CheckSquare,
  },
  {
    title: "Credentials",
    href: "/admin/issuance",
    icon: Award,
    children: [
      { title: "Issue Credentials", href: "/admin/issuance", icon: Award },
      { title: "Manage Degrees", href: "/admin/degrees", icon: GraduationCap },
      { title: "Corrections", href: "/admin/corrections", icon: ScrollText },
    ],
  },
  {
    title: "Curriculum",
    href: "/admin/curriculum",
    icon: BookOpen,
  },
  {
    title: "Audit Logs",
    href: "/admin/logs",
    icon: ScrollText,
  },
  {
    title: "Export",
    href: "/admin/export",
    icon: Download,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Support",
    href: "/support",
    icon: HelpCircle,
  },
]
