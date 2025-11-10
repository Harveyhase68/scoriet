/**
 * Auth utility functions
 * Handles token retrieval from both localStorage and sessionStorage
 * (Demo mode uses sessionStorage, normal mode uses localStorage)
 */

/**
 * Get access token from either localStorage or sessionStorage
 * Checks localStorage first (normal login), then sessionStorage (demo/non-remember login)
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

/**
 * Get refresh token from either localStorage or sessionStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  return !!(getAccessToken());
}

/**
 * Check if user is in demo mode
 */
export function isDemoMode(): boolean {
  return sessionStorage.getItem('demo_mode') === 'true';
}
