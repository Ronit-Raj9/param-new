const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, string[]>,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith("/api") ? url : `${API_BASE_URL}${url}`

  const res = await fetch(fullUrl, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    let error: { message: string; code?: string; details?: Record<string, string[]> }
    try {
      error = await res.json()
    } catch {
      error = { message: res.statusText || "An error occurred" }
    }
    throw new ApiError(error.message, res.status, error.code, error.details)
  }

  return res.json()
}

export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  return fetcher<T>(url, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function apiPatch<T>(url: string, data: unknown): Promise<T> {
  return fetcher<T>(url, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function apiDelete<T>(url: string): Promise<T> {
  return fetcher<T>(url, {
    method: "DELETE",
  })
}
