import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Construction } from "lucide-react"

export const metadata: Metadata = {
    title: "Quick Table Entry",
}

export default function QuickTablePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/results/add">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quick Table Entry</h1>
                    <p className="text-muted-foreground">Spreadsheet-like entry for full flexibility</p>
                </div>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Construction className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="mb-2">Coming Soon</CardTitle>
                    <CardDescription className="text-center max-w-md">
                        The Quick Table entry mode is under development. For now, please use Single Student or Batch Entry modes.
                    </CardDescription>
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="bg-transparent" asChild>
                            <Link href="/admin/results/add/single">Single Student</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/admin/results/add/batch">Batch Entry</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
