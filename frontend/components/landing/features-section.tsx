import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, GraduationCap, Share2, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Instant Results Access",
    description: "View your semester results as soon as they are published. Download official mark sheets anytime.",
  },
  {
    icon: GraduationCap,
    title: "Digital Degree Certificates",
    description: "Access and download your degree certificate and official transcripts in verified digital format.",
  },
  {
    icon: Share2,
    title: "Share with Employers",
    description: "Generate secure shareable links for your credentials. Control access with expiry dates.",
  },
  {
    icon: ShieldCheck,
    title: "Tamper-Proof Verification",
    description: "All credentials are cryptographically secured. Employers can verify authenticity instantly.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-10 sm:py-12 md:py-16 bg-background">
      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="text-center mb-8 sm:mb-10 px-4 sm:px-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Everything You Need</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            A complete solution for managing and sharing your academic credentials securely.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-xl"
            >
              <CardHeader className="pb-3">
                <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-medium text-slate-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
