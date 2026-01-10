import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-10 sm:py-12 md:py-16">
      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="rounded-xl bg-primary p-6 sm:p-8 md:p-10 text-center text-primary-foreground">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Ready to Get Started?</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-primary-foreground/90 max-w-lg mx-auto leading-relaxed px-4 sm:px-0">
            Access your academic credentials today. Login with your institutional email to view results, download
            certificates, and share verified credentials.
          </p>
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-4 sm:px-0">
            <Button asChild size="lg" variant="secondary" className="rounded-md shadow-none">
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="rounded-md text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/docs">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
