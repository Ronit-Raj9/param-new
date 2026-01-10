import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, FileText, Share2, ShieldCheck, User, LogIn, Link2, Building2, CheckCircle2 } from "lucide-react"

const studentGuides = [
  {
    icon: LogIn,
    title: "Getting Started",
    description: "Learn how to login and navigate your dashboard",
    steps: [
      "Visit the PARAM portal and click 'Student Login'",
      "Enter your institutional email address",
      "Receive OTP on your email and verify",
      "Access your personalized dashboard",
    ],
  },
  {
    icon: FileText,
    title: "Viewing Results",
    description: "Access and download your semester results",
    steps: [
      "Navigate to 'Results' from the sidebar",
      "View all your semester results in one place",
      "Click on any result to see detailed marks",
      "Download official mark sheet as PDF",
    ],
  },
  {
    icon: GraduationCap,
    title: "Degree Certificate",
    description: "Access your digital degree certificate",
    steps: [
      "Go to 'Degree' section in your dashboard",
      "View your degree status and details",
      "Download the official digital certificate",
      "Share with employers using verification links",
    ],
  },
  {
    icon: Share2,
    title: "Sharing Credentials",
    description: "Generate secure verification links",
    steps: [
      "Navigate to 'Share Credentials' section",
      "Select the credential you want to share",
      "Set an optional expiry date",
      "Copy and share the verification link",
    ],
  },
]

const verifierGuide = [
  {
    icon: Link2,
    title: "Using Verification Link",
    description: "Verify credentials using a shared link",
    steps: [
      "Receive verification link from the credential holder",
      "Open the link in your browser",
      "View verified credential details",
      "Check authenticity and validity status",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Using Verification Token",
    description: "Verify credentials using a token",
    steps: [
      "Go to PARAM portal homepage",
      "Enter the verification token in the search box",
      "Click 'Verify' to check the credential",
      "View verified details and authenticity",
    ],
  },
]

export function DocsPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-7xl px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Documentation
          </Badge>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">How to Use PARAM</h1>
          <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
            Complete guide for students, employers, and administrators
          </p>
        </div>

        {/* For Students */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">For Students</h2>
              <p className="text-sm text-slate-600">Access and manage your academic credentials</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {studentGuides.map((guide, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <guide.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{guide.title}</CardTitle>
                      <CardDescription className="text-sm">{guide.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {guide.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3 text-sm">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {stepIndex + 1}
                        </span>
                        <span className="text-slate-600">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* For Employers/Verifiers */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">For Employers & Verifiers</h2>
              <p className="text-sm text-slate-600">Verify academic credentials securely</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {verifierGuide.map((guide, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <guide.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{guide.title}</CardTitle>
                      <CardDescription className="text-sm">{guide.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {guide.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3 text-sm">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {stepIndex + 1}
                        </span>
                        <span className="text-slate-600">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Security Note */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Security & Authenticity</h3>
                <p className="text-sm text-slate-600 mt-1">
                  All credentials issued through PARAM are cryptographically secured and can be verified instantly. Each
                  verification link contains a unique token that confirms the authenticity of the credential and shows
                  the exact details as recorded in our system. Tampering with credentials is not possible as any
                  modification will invalidate the verification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
