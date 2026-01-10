import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")
  const roleCookie = request.cookies.get("user_role")

  if (!sessionCookie) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  // In production, validate session token and fetch user from database
  // For demo, return mock user based on role cookie
  const role = roleCookie?.value || "STUDENT"

  const mockUsers = {
    STUDENT: {
      id: "student-1",
      name: "Rahul Sharma",
      email: "rahul.sharma@iiitm.ac.in",
      role: "STUDENT",
      enrollmentNumber: "2020BCS001",
      isActive: true,
      createdAt: "2020-08-01T00:00:00Z",
    },
    ADMIN: {
      id: "admin-1",
      name: "Dr. Admin User",
      email: "admin@iiitm.ac.in",
      role: "ADMIN",
      isActive: true,
      createdAt: "2019-01-01T00:00:00Z",
    },
    ACADEMIC: {
      id: "academic-1",
      name: "Prof. Academic Staff",
      email: "academic@iiitm.ac.in",
      role: "ACADEMIC",
      isActive: true,
      createdAt: "2019-01-01T00:00:00Z",
    },
  }

  const user = mockUsers[role as keyof typeof mockUsers] || mockUsers.STUDENT

  return NextResponse.json(user)
}
