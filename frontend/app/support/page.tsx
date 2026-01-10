import type { Metadata } from "next"
import { SupportPage } from "@/components/support/support-page"
import { Topbar } from "@/components/layout/topbar"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Support | PARAM",
  description: "Get help with PARAM academic credential system",
}

export default function Support() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="flex-1">
        <SupportPage />
      </main>
      <Footer />
    </div>
  )
}
