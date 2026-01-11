import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * GET /api/me
 * This route proxies to the backend /api/v1/auth/me endpoint.
 * 
 * In production, this is handled by Next.js rewrites in next.config.mjs.
 * This route is a fallback for when the backend is unavailable.
 */
export async function GET(request: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
  
  // Try cookie-based authentication first
  const sessionCookie = request.cookies.get("session")
  
  try {
    const response = await fetch(`${backendUrl}/v1/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        "Cookie": sessionCookie ? `session=${sessionCookie.value}` : "",
      },
      credentials: "include",
    })
    
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data.data?.user || data.data || data)
    }
    
    if (response.status === 401) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }
    
    return NextResponse.json({ message: "Authentication failed" }, { status: response.status })
  } catch (error) {
    console.error("Error fetching user from backend:", error)
    return NextResponse.json({ message: "Backend unavailable" }, { status: 503 })
  }
}
