'use client'

// IMPORTANT: next.config.js sets `basePath: '/dvl'`. Next.js automatically
// rewrites this basePath for pages, <Link>, next/navigation, etc., but it
// does NOT rewrite plain fetch() calls. A call like fetch('/api/ai-log')
// from the browser resolves to https://<domain>/api/ai-log — NOT
// https://<domain>/dvl/api/ai-log — because a leading "/" is an
// origin-absolute path, not a path relative to the current page.
//
// Since Nginx only proxies /dvl/* to this app, that request 404s at the
// Nginx layer before it ever reaches Next.js. The old code treated any
// non-ok response as a silent no-op (no error shown to the user), so this
// looked exactly like "the Save button doesn't do anything" — which is
// the bug reported by students on the AI Build Log form.
//
// Fix: always go through this helper for client-side calls to internal
// API routes so the basePath is applied consistently in one place.

export const API_BASE_PATH = '/dvl'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * fetch() wrapper for calling this app's own /api/* routes from client
 * components. Prepends the basePath and throws a descriptive ApiError on
 * any non-2xx response instead of failing silently.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const url = `${API_BASE_PATH}${normalized}`

  let res: Response
  try {
    res = await fetch(url, init)
  } catch (err) {
    throw new ApiError('Network error — please check your connection and try again.', 0)
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.clone().json()
      if (body?.error) message = body.error
    } catch {
      // response wasn't JSON; keep default message
    }
    if (res.status === 401) {
      message = 'Your session has expired. Please refresh the page and log in again.'
    }
    throw new ApiError(message, res.status)
  }

  return res
}
