import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api, ApiError, setAuthToken } from '../api/client'
import type { LoginResponse, SetupStatus, UserInfo } from '../api/types'

const TOKEN_KEY = '{:packagename:}.jwt'

/**
 * Global app state: has the setup wizard run, and who is logged in?
 *
 * On startup it reads the setup status and, if a token is stored, validates it via
 * /api/auth/me. The JWT lives in expo-secure-store so the user stays logged in across
 * app restarts. RootNavigator switches stacks based on this state.
 */
interface AuthState {
  /** True while the initial setup/auth check is running. */
  loading: boolean
  /** Backend unreachable (not even the setup API answered). */
  backendError: string | null
  setup: SetupStatus | null
  user: UserInfo | null
  bootstrap: () => Promise<void>
  runSetup: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [setup, setSetup] = useState<SetupStatus | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)

  const bootstrap = useCallback(async () => {
    setLoading(true)
    setBackendError(null)
    try {
      const status = await api<SetupStatus>('/api/setup/status')
      setSetup(status)
      if (status.installed) {
        const token = await SecureStore.getItemAsync(TOKEN_KEY)
        if (token) {
          setAuthToken(token)
          try {
            setUser(await api<UserInfo>('/api/auth/me'))
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              // stale / expired token
              await SecureStore.deleteItemAsync(TOKEN_KEY)
              setAuthToken(null)
              setUser(null)
            } else {
              throw error
            }
          }
        }
      }
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  /** First-run fallback: create the DB tables + sample data, then re-check. */
  const runSetup = useCallback(async () => {
    await api<void>('/api/setup/install', { method: 'POST' })
    await bootstrap()
  }, [bootstrap])

  const login = useCallback(async (username: string, password: string) => {
    const result = await api<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    await SecureStore.setItemAsync(TOKEN_KEY, result.token)
    setAuthToken(result.token)
    setUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    setAuthToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ loading, backendError, setup, user, bootstrap, runSetup, login, logout }),
    [loading, backendError, setup, user, bootstrap, runSetup, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const state = useContext(AuthContext)
  if (!state) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return state
}
