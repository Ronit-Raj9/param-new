import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Next.js Middleware for route protection and role-based access control
 */

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/activate",
  "/reset-password",
  "/docs",
  "/support",
]

// Routes that match these patterns are public
const PUBLIC_PATTERNS = [
  /^\/verify\/.+/, // /verify/[token]
  /^\/docs\/.+/, // /docs/[slug]
  /^\/api\/verify/,  // Public API routes
  /^\/api\/health/,
]

// Admin routes (require ADMIN or ACADEMIC role)
const ADMIN_ROUTES = ["/admin"]

// Student routes (require STUDENT role)
const STUDENT_ROUTES = ["/student"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow public patterns
  if (PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/_next") ||
    pathname.includes("/favicon") ||
    pathname.includes("/public/") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("session")
  const userRoleCookie = request.cookies.get("user_role")

  // If no session, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control
  const userRole = userRoleCookie?.value

  // Admin routes - require ADMIN or ACADEMIC role
  if (pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN" && userRole !== "ACADEMIC") {
      // Redirect to appropriate dashboard based on role
      if (userRole === "STUDENT") {
        return NextResponse.redirect(new URL("/student", request.url))
      }
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // Student routes - require STUDENT role
  if (pathname.startsWith("/student")) {
    if (userRole !== "STUDENT") {
      // Redirect to admin if user is admin/academic
      if (userRole === "ADMIN" || userRole === "ACADEMIC") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
