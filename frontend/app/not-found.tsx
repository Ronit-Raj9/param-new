import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Topbar } from "@/components/layout/topbar"
import { Footer } from "@/components/layout/footer"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar showNav={false} />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container max-w-md text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">The page you are looking for does not exist or has been moved.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
