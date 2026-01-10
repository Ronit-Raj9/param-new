import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { VerifySection } from "@/components/landing/verify-section"
import { CTASection } from "@/components/landing/cta-section"
import { Topbar } from "@/components/layout/topbar"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Topbar />
      <main className="flex-1 w-full">
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <VerifySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
