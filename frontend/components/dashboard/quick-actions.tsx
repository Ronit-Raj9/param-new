import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Share2, HelpCircle } from "lucide-react"

const actions = [
  {
    title: "View Results",
    description: "Check your semester results",
    icon: FileText,
    href: "/student/results",
    variant: "default" as const,
  },
  {
    title: "Download Transcript",
    description: "Get official transcripts",
    icon: Download,
    href: "/student/degree",
    variant: "outline" as const,
  },
  {
    title: "Share Credentials",
    description: "Create verification links",
    icon: Share2,
    href: "/student/share",
    variant: "outline" as const,
  },
  {
    title: "Get Support",
    description: "Contact helpdesk",
    icon: HelpCircle,
    href: "/support",
    variant: "outline" as const,
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => (
            <Button
              key={action.title}
              asChild
              variant={action.variant}
              className={`h-auto py-4 flex-col items-start gap-1 ${action.variant === "outline" ? "bg-transparent" : ""}`}
            >
              <Link href={action.href}>
                <div className="flex items-center gap-2 w-full">
                  <action.icon className="h-4 w-4" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <span className="text-xs font-normal opacity-80 text-left">{action.description}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
