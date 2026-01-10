import { LogIn, Eye, Share } from "lucide-react"

const steps = [
  {
    step: 1,
    icon: LogIn,
    title: "Login Securely",
    description: "Sign in with your institutional email using secure OTP authentication.",
  },
  {
    step: 2,
    icon: Eye,
    title: "View & Download",
    description: "Access your semester results, transcripts, and degree certificates instantly.",
  },
  {
    step: 3,
    icon: Share,
    title: "Share Credentials",
    description: "Generate verification links to share your credentials with employers or institutions.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-10 sm:py-12 md:py-16 bg-slate-50/50">
      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="text-center mb-8 sm:mb-10 px-4 sm:px-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">How It Works</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">Get started with PARAM in three simple steps</p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Connection line - thinner */}
          <div
            className="absolute top-8 left-0 right-0 h-px bg-slate-200 hidden lg:block"
            style={{ left: "16.66%", right: "16.66%" }}
          />

          <div className="grid gap-8 sm:gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex flex-col items-center">
                  <span className="text-xs font-semibold text-primary mb-2">Step {item.step}</span>
                  <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center relative z-10">
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-1.5">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
