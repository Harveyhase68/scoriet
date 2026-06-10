/**
 * Minimal fetch wrapper for the Spring Boot REST API:
 * - prefixes every path with the configured backend base URL
 * - sends/receives JSON and attaches the JWT as `Authorization: Bearer` on every request
 * - turns error responses into ApiError (status, message, fieldErrors, setupRequired)
 *
 * Unlike the web variant there are no cookies and no CSRF token: auth is a stateless
 * Bearer token kept in memory here (set by AuthContext after login/bootstrap).
 */
import { API_BASE_URL } from '../config'

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

let authToken: string | null = null

/** Set/cleared by AuthContext; attached to every request as a Bearer token. */
export function setAuthToken(token: string | null): void {
  authToken = token
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch (networkError) {
    // fetch only rejects on network failure (backend unreachable / wrong API_BASE_URL)
    throw new ApiError(0, networkError instanceof Error ? networkError.message : 'Network request failed')
  }

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
