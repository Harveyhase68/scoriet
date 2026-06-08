/**
 * Minimal fetch wrapper for the Spring Boot REST API:
 * - sends/receives JSON
 * - echoes Spring Security's XSRF-TOKEN cookie as X-XSRF-TOKEN header on mutations
 * - turns error responses into ApiError (status, message, fieldErrors, setupRequired)
 */

export class ApiError extends Error {
  status: number
  /** Field name -> message, present on 422 validation errors. */
  fieldErrors: Record<string, string> | null
  /** True when the backend answered 503 because the setup wizard has not run yet. */
  setupRequired: boolean

  constructor(status: number, message: string,
              fieldErrors: Record<string, string> | null = null,
              setupRequired = false) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
    this.setupRequired = setupRequired
  }
}

function csrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (method !== 'GET') {
    const token = csrfToken()
    if (token) {
      headers['X-XSRF-TOKEN'] = token
    }
  }

  const response = await fetch(path, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    let fieldErrors: Record<string, string> | null = null
    let setupRequired = false
    try {
      const body = await response.json()
      if (typeof body?.message === 'string') message = body.message
      if (body?.fieldErrors) fieldErrors = body.fieldErrors
      if (body?.setupRequired) setupRequired = true
    } catch {
      // no JSON body (e.g. plain 401/403) - keep the status text
    }
    throw new ApiError(response.status, message, fieldErrors, setupRequired)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}
