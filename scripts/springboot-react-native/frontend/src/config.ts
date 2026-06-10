import Constants from 'expo-constants'

/**
 * Base URL of the Spring Boot backend.
 *
 * Unlike the web SPA, `localhost` on a phone/emulator points at the device itself, so the
 * backend must be reached via the dev machine's network address. Configure it in app.json
 * under `expo.extra.apiBaseUrl` (see the comment there); this constant just reads that value.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string }

export const API_BASE_URL = extra.apiBaseUrl ?? 'http://10.0.2.2:8080'
