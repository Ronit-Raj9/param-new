import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Users, TableIcon, Upload, ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
    title: "Add Results",
}

const entryModes = [
    {
        id: "single",
        title: "Single Student",
        description: "Add results for one student with all their courses",
        icon: User,
        href: "/admin/results/add/single",
        primary: true,
    },
    {
        id: "batch",
        title: "Batch Entry",
        description: "Add results for multiple students, one course at a time",
        icon: Users,
        href: "/admin/results/add/batch",
        primary: true,
    },
    {
        id: "table",
        title: "Quick Table",
        description: "Spreadsheet-like entry for full flexibility",
        icon: TableIcon,
        href: "/admin/results/add/table",
        primary: false,
    },
    {
        id: "csv",
        title: "Upload CSV",
        description: "Bulk import from CSV file",
        icon: Upload,
        href: "/admin/results/upload",
        primary: false,
    },
]

export default function AddResultsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/results/preview">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Results</h1>
                    <p className="text-muted-foreground">Choose how you want to add student results</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {entryModes.map((mode) => (
                    <Card
                        key={mode.id}
                        className={`hover:border-primary/50 transition-colors cursor-pointer ${mode.primary ? "" : "opacity-80"
                            }`}
                    >
                        <Link href={mode.href} className="block">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${mode.primary ? "bg-primary text-primary-foreground" : "bg-muted"
                                        }`}>
                                        <mode.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{mode.title}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-sm">
                                    {mode.description}
                                </CardDescription>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>

            <Card className="bg-muted/30">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="text-muted-foreground">
                            <p className="text-sm font-medium mb-2">Need help choosing?</p>
                            <ul className="text-sm space-y-1">
                                <li>• <strong>Single Student</strong> - Best for adding complete semester results for 1-3 students</li>
                                <li>• <strong>Batch Entry</strong> - Best for entering one subject's grades for an entire class</li>
                                <li>• <strong>Quick Table</strong> - Full control, enter any data in any order</li>
                                <li>• <strong>CSV Upload</strong> - Best for large imports with data already in spreadsheet</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
