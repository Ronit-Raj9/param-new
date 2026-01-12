# Complete Auth Flow Analysis Report

## Executive Summary

This document provides a comprehensive analysis of the authentication flow for admin/staff users in the PARAM Academic Credential Management System. The auth system uses **Privy** for authentication (OAuth/Email OTP) and implements role-based access control (RBAC) across frontend and backend.

---

## 1. Complete Auth Flow (Step-by-Step)

### 1.1 Frontend Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND AUTH FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. User visits /login                                                          │
│         ↓                                                                        │
│  2. LoginForm renders → Privy SDK initializes                                   │
│         ↓                                                                        │
│  3. User clicks "Continue with Email" or "Continue with Google"                 │
│         ↓                                                                        │
│  4. Privy handles OAuth/OTP flow (email verification)                           │
│         ↓                                                                        │
│  5. Privy returns authenticated=true + user object                              │
│         ↓                                                                        │
│  6. AuthProvider.syncWithBackend() is triggered                                 │
│         ↓                                                                        │
│  7. getAccessToken() retrieves Privy JWT token                                  │
│         ↓                                                                        │
│  8. POST /api/v1/auth/login with { token: privyJWT }                           │
│         ↓                                                                        │
│  9. Backend verifies token, returns user data                                   │
│         ↓                                                                        │
│  10. Frontend sets cookies: session={token}, user_role={role}                   │
│         ↓                                                                        │
│  11. User redirected based on role (ADMIN/ACADEMIC → /admin, STUDENT → /student)│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Provider Hierarchy

```tsx
// app/layout.tsx
<PrivyProvider>           // Privy SDK initialization
  <QueryProvider>         // TanStack Query for data fetching
    <AuthProvider>        // Syncs Privy auth with backend
      {children}
    </AuthProvider>
  </QueryProvider>
</PrivyProvider>
```

### 1.3 Key Files & Responsibilities

| File | Responsibility |
|------|----------------|
| [providers/privy-provider.tsx](frontend/providers/privy-provider.tsx) | Initializes Privy SDK with config |
| [providers/auth-provider.tsx](frontend/providers/auth-provider.tsx) | Syncs Privy with backend, manages user state |
| [lib/privy-config.ts](frontend/lib/privy-config.ts) | Privy configuration (login methods, chains) |
| [hooks/use-auth.ts](frontend/hooks/use-auth.ts) | Auth hooks: useAuth, useRequireRole |
| [hooks/use-api.ts](frontend/hooks/use-api.ts) | Adds Bearer token to API requests |
| [middleware.ts](frontend/middleware.ts) | Route protection via cookies |

---

## 2. Backend Authentication Flow

### 2.1 Auth Request Processing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND AUTH FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. Request arrives at /api/v1/auth/login                                       │
│         ↓                                                                        │
│  2. auth.controller.login() parses request body (Zod validation)                │
│         ↓                                                                        │
│  3. auth.service.authenticateWithPrivy(token)                                   │
│         ↓                                                                        │
│  4. config/privy.ts verifyPrivyToken() → PrivyClient.verifyAuthToken()          │
│         ↓                                                                        │
│  5. Get/Create user in database by Privy DID                                    │
│         ↓                                                                        │
│  6. Return { user, isNewUser } to controller                                    │
│         ↓                                                                        │
│  7. Controller logs action, returns user data                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Protected Route Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PROTECTED ROUTE FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. Request with Authorization: Bearer <token>                                  │
│         ↓                                                                        │
│  2. auth.middleware.authenticate() extracts token                               │
│         ↓                                                                        │
│  3. verifyPrivyToken() validates JWT with Privy                                 │
│         ↓                                                                        │
│  4. Lookup user by privyId in database                                          │
│         ↓                                                                        │
│  5. Attach user to req.user                                                     │
│         ↓                                                                        │
│  6. role.guard.requireRole() checks if user.role in allowedRoles                │
│         ↓                                                                        │
│  7. route.guard.requireAuth() checks user.status === "ACTIVE"                   │
│         ↓                                                                        │
│  8. Controller handles request                                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Key Backend Files

| File | Responsibility |
|------|----------------|
| [modules/auth/auth.routes.ts](backend/src/modules/auth/auth.routes.ts) | Auth route definitions |
| [modules/auth/auth.controller.ts](backend/src/modules/auth/auth.controller.ts) | Request handlers |
| [modules/auth/auth.service.ts](backend/src/modules/auth/auth.service.ts) | Business logic |
| [modules/auth/auth.middleware.ts](backend/src/modules/auth/auth.middleware.ts) | JWT verification |
| [modules/auth/auth.schema.ts](backend/src/modules/auth/auth.schema.ts) | Zod validation schemas |
| [middleware/role.guard.ts](backend/src/middleware/role.guard.ts) | RBAC middleware |
| [config/privy.ts](backend/src/config/privy.ts) | Privy client setup |

---

## 3. Role-Based Access Control (RBAC)

### 3.1 Roles

| Role | Description | Access |
|------|-------------|--------|
| `ADMIN` | System administrators | Full access to all features |
| `ACADEMIC` | Academic staff | Manage students, results, curriculum |
| `STUDENT` | Students | View own results, credentials |
| `VERIFIER` | External verifiers | Public verification only |

### 3.2 Route Protection Matrix

| Route Pattern | Required Roles | Middleware |
|---------------|----------------|------------|
| `/api/v1/users/*` | ADMIN | `requireAdmin` |
| `/api/v1/students/*` | ADMIN, ACADEMIC | `requireRole("ADMIN", "ACADEMIC")` |
| `/api/v1/results/*` | ADMIN, ACADEMIC | `requireRole("ADMIN", "ACADEMIC")` |
| `/api/v1/results/student` | STUDENT | `requireStudent` |
| `/api/v1/approvals/*` | ADMIN, ACADEMIC | `requireRole("ADMIN", "ACADEMIC")` |
| `/api/v1/credentials/student` | STUDENT | `requireStudent` |
| `/api/v1/settings/*` | ADMIN | `requireAdmin` |

---

## 4. Issues Found

### 4.1 🔴 CRITICAL: Session Cookie Security Issue

**File:** [frontend/providers/auth-provider.tsx#L77-L78](frontend/providers/auth-provider.tsx#L77-L78)

```typescript
// Set cookies for middleware route protection
document.cookie = `session=${token.substring(0, 50)}; path=/; max-age=${60 * 60 * 24}` // 24 hours
document.cookie = `user_role=${data.data.user.role}; path=/; max-age=${60 * 60 * 24}`
```

**Issues:**
1. **Session cookie is just a truncated token** - No actual server-side session management
2. **User role cookie can be tampered** - Client sets the role, can be modified in browser
3. **Missing `Secure` flag** - Cookie sent over HTTP (should be `Secure` in production)
4. **Missing `HttpOnly` flag** - Vulnerable to XSS attacks
5. **Missing `SameSite` attribute** - CSRF vulnerability

**Recommended Fix:**
```typescript
// Backend should set HttpOnly cookies via Set-Cookie header
// Frontend should NOT set auth cookies via document.cookie
```

---

### 4.2 🔴 CRITICAL: Frontend Role Check Bypass

**File:** [frontend/middleware.ts#L68](frontend/middleware.ts#L68)

```typescript
const userRole = userRoleCookie?.value

// Admin routes - require ADMIN or ACADEMIC role
if (pathname.startsWith("/admin")) {
  if (userRole !== "ADMIN" && userRole !== "ACADEMIC") {
    // ...
  }
}
```

**Issue:** The middleware relies on a client-set cookie for role verification. A user could:
1. Login as STUDENT
2. Modify `user_role` cookie to `ADMIN`
3. Access admin routes

**Impact:** Complete bypass of frontend route protection.

**Recommended Fix:** Verify role on backend for every protected request (which is already done). Remove frontend role cookie reliance or make it server-side only.

---

### 4.3 🟡 MEDIUM: Missing User Status Check in Frontend

**File:** [frontend/middleware.ts](frontend/middleware.ts)

**Issue:** The frontend middleware checks for session and role cookies but does NOT verify if the user account is `ACTIVE`. A `SUSPENDED` or `PENDING_ACTIVATION` user could still access routes if they have valid cookies.

**Backend has this check at:** [backend/src/middleware/role.guard.ts#L67](backend/src/middleware/role.guard.ts#L67)
```typescript
if (req.user.status !== "ACTIVE") {
  res.status(403).json({
    success: false,
    error: {
      code: ERROR_CODES.FORBIDDEN,
      message: `Account is ${req.user.status.toLowerCase()}`,
    },
  });
  return;
}
```

**Recommendation:** Either:
1. Store user status in cookie and check in middleware, OR
2. Make a lightweight `/api/v1/auth/status` endpoint to verify on each navigation

---

### 4.4 🟡 MEDIUM: Token Refresh Race Condition

**File:** [frontend/hooks/use-api.ts#L56-L67](frontend/hooks/use-api.ts#L56-L67)

```typescript
const apiFetch = useCallback(
  async <T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    // ...
    let token = tokenRef.current
    if (!skipAuth && authenticated) {
      try {
        token = await getAccessToken()  // Can throw if Privy session expired
        tokenRef.current = token
      } catch (error) {
        console.error("Failed to get access token:", error)
        // ⚠️ Still proceeds with null token or stale token
      }
    }
```

**Issue:** If `getAccessToken()` fails, the request continues with potentially null/stale token. No retry logic or user notification.

**Recommended Fix:**
```typescript
if (!skipAuth && authenticated) {
  try {
    token = await getAccessToken()
    tokenRef.current = token
  } catch (error) {
    // Force logout and redirect to login
    await logout()
    throw new Error("Session expired. Please login again.")
  }
}
```

---

### 4.5 🟡 MEDIUM: Duplicate Auth Logic

**File:** [backend/src/modules/auth/auth.middleware.ts#L66-L119](backend/src/modules/auth/auth.middleware.ts#L66-L119)

**Issue:** The `authenticate` middleware duplicates user creation logic that already exists in `auth.service.authenticateWithPrivy()`. This can lead to inconsistencies.

```typescript
// In auth.middleware.ts - creates user if not found
if (!user) {
  const privyUser = await getPrivyUser(claims.userId);
  // ... creates user
}

// In auth.service.ts - also creates user if not found
if (!user) {
  const privyUser = await getPrivyUser(claims.userId);
  // ... creates user
}
```

**Recommendation:** Extract user get-or-create logic to a single service function.

---

### 4.6 🟢 LOW: Missing Error Boundary for Auth Failures

**File:** [frontend/providers/auth-provider.tsx#L86-93](frontend/providers/auth-provider.tsx#L86-93)

```typescript
} catch (error) {
  console.error("❌ Error syncing with backend:", error)
  console.error("💡 Make sure the backend is running at:", API_URL)
  console.error("💡 Check the browser console Network tab for details")
  setBackendUser(null)
}
```

**Issue:** Auth errors are only logged to console. User sees no feedback when backend is unreachable or returns errors.

**Recommendation:** Show toast notification or error state to user.

---

### 4.7 🟢 LOW: Privy Config Missing Error Handling

**File:** [frontend/providers/privy-provider.tsx#L11-14](frontend/providers/privy-provider.tsx#L11-14)

```typescript
if (!appId) {
  console.error("NEXT_PUBLIC_PRIVY_APP_ID is not set")
  return <>{children}</>  // Renders children without auth!
}
```

**Issue:** If Privy App ID is missing, the app renders without auth capabilities. Should show an error page or prevent app from loading.

---

### 4.8 🟢 LOW: No Session Invalidation on Logout

**File:** [frontend/providers/auth-provider.tsx#L116-135](frontend/providers/auth-provider.tsx#L116-135)

```typescript
const logout = React.useCallback(async () => {
  try {
    // Call backend logout
    await fetch(`${API_URL}/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {})  // ⚠️ Silently ignores backend logout failure
    
    // Clear cookies
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    // ...
  }
})
```

**Issue:** Backend logout endpoint just logs the action; doesn't invalidate any server-side session (because there is none). Privy token remains valid until expiry.

---

## 5. Security Recommendations

### 5.1 Implement Proper Session Management

```typescript
// Backend: Create session on login, store in Redis
const sessionId = generateSecureSessionId();
await redis.set(`session:${sessionId}`, JSON.stringify({
  userId: user.id,
  role: user.role,
  status: user.status,
  expiresAt: Date.now() + SESSION_DURATION
}), 'EX', SESSION_DURATION);

// Set HttpOnly cookie
res.cookie('session_id', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: SESSION_DURATION
});
```

### 5.2 Remove Client-Side Role Cookie

```typescript
// Remove this from auth-provider.tsx:
document.cookie = `user_role=${data.data.user.role}; path=/; max-age=${60 * 60 * 24}`

// Instead, fetch role on each request via session or decode from backend
```

### 5.3 Add User Status to Frontend State

```typescript
// In auth-provider.tsx, add status check:
React.useEffect(() => {
  if (backendUser?.status !== "ACTIVE") {
    logout();
    router.push("/account-suspended");
  }
}, [backendUser?.status]);
```

### 5.4 Implement Token Blacklist for Logout

```typescript
// Backend logout should blacklist the token:
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (token) {
    // Add to Redis blacklist until token expiry
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await redis.set(`blacklist:${token}`, '1', 'EX', ttl);
  }
  // ...
});
```

---

## 6. Summary

### What's Working Well ✅

1. **Privy integration** - Solid OAuth/OTP flow
2. **Backend RBAC** - Proper role guards on all routes
3. **User status checks** - Backend validates ACTIVE status
4. **Zod validation** - Input validation on all routes
5. **Audit logging** - Login/logout/actions are logged

### Critical Issues to Fix 🔴

1. **Client-settable role cookie** - Complete frontend bypass
2. **No HttpOnly cookies** - XSS vulnerability
3. **No server-side sessions** - Session cookie is just truncated token

### Medium Priority 🟡

4. **Token refresh error handling** - Silent failures
5. **Duplicate user creation logic** - Maintenance issue
6. **Missing user status check in frontend** - Inconsistent behavior

### Low Priority 🟢

7. **No user-facing auth error feedback**
8. **Missing Privy config error handling**
9. **Silent logout failures**

---

*Generated: January 12, 2026*
