import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { siteConfig } from "@/config/site"

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/50">
      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10 py-8 sm:py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-12">
          <div className="space-y-3">
            <Logo />
            <p className="text-sm text-slate-500 leading-relaxed">
              Secure academic credential management system for {siteConfig.institution.name}.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/verify" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Verify Credentials
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Contact</h4>
            <address className="not-italic text-sm text-slate-500 space-y-1.5">
              <p>{siteConfig.institution.fullName}</p>
              <p>{siteConfig.institution.address}</p>
              <p>
                <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-slate-900 transition-colors">
                  {siteConfig.supportEmail}
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {siteConfig.institution.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
