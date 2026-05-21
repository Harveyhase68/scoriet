/**
 * Auth utility functions
 * Handles token retrieval from both localStorage and sessionStorage
 * (Demo mode uses sessionStorage, normal mode uses localStorage)
 */

/**
 * Read a token value from localStorage (preferred) or sessionStorage,
 * filtering out the literal strings "null" and "undefined" that older
 * code paths may have written when the backend returned a null value.
 */
function readStoredToken(key: string): string | null {
  const value = localStorage.getItem(key) ?? sessionStorage.getItem(key);
  if (!value || value === 'null' || value === 'undefined') {
    return null;
  }
  return value;
}

/**
 * Get access token from either localStorage or sessionStorage
 * Checks localStorage first (normal login), then sessionStorage (demo/non-remember login)
 */
export function getAccessToken(): string | null {
  return readStoredToken('access_token');
}

/**
 * Get refresh token from either localStorage or sessionStorage
 */
export function getRefreshToken(): string | null {
  return readStoredToken('refresh_token');
}

/**
 * Determine which Storage the current tokens live in. Prefers the storage
 * that already holds the access_token; falls back to the remember_me flag
 * for the rare case where the token was just cleared.
 */
function getTokenStorage(): Storage {
  if (localStorage.getItem('access_token')) return localStorage;
  if (sessionStorage.getItem('access_token')) return sessionStorage;
  return localStorage.getItem('remember_me') === 'true' ? localStorage : sessionStorage;
}

/**
 * Persist a freshly issued access/refresh token pair into the correct
 * Storage. Used after a successful refresh-token exchange. The refresh
 * token is rotated by Passport on every refresh, so we always overwrite
 * the previously stored value (or remove it if the backend returned none).
 */
export function setTokens(accessToken: string, refreshToken: string | null): void {
  const storage = getTokenStorage();
  storage.setItem('access_token', accessToken);
  if (refreshToken) {
    storage.setItem('refresh_token', refreshToken);
  } else {
    storage.removeItem('refresh_token');
  }
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
