import type { Metadata } from "next"
import { DocsPage } from "@/components/docs/docs-page"
import { Topbar } from "@/components/layout/topbar"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Documentation | PARAM",
  description: "Learn how to use PARAM academic credential system",
}

export default function Docs() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="flex-1">
        <DocsPage />
      </main>
      <Footer />
    </div>
  )
}
