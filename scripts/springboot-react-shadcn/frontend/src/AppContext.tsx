import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError } from './api/client'
import type { SetupStatus, UserInfo } from './api/types'

/**
 * Global app state: has the setup wizard run, and who is logged in?
 * Loaded once on startup; the route guards in App.tsx redirect to
 * /setup or /login based on it.
 */
interface AppState {
  /** True while the initial setup/auth check is running. */
  loading: boolean
  /** Backend unreachable (not even the setup API answered). */
  backendError: string | null
  setup: SetupStatus | null
  user: UserInfo | null
  refreshSetup: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [setup, setSetup] = useState<SetupStatus | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)

  const refreshSetup = useCallback(async () => {
    setBackendError(null)
    try {
      const status = await api<SetupStatus>('/api/setup/status')
      setSetup(status)
      if (status.installed) {
        try {
          setUser(await api<UserInfo>('/api/auth/me'))
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            setUser(null) // not logged in yet
          } else {
            throw error
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
    void refreshSetup()
  }, [refreshSetup])

  const login = useCallback(async (username: string, password: string) => {
    setUser(await api<UserInfo>('/api/auth/login', { method: 'POST', body: { username, password } }))
  }, [])

  const logout = useCallback(async () => {
    await api<void>('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const value = useMemo<AppState>(
    () => ({ loading, backendError, setup, user, refreshSetup, login, logout }),
    [loading, backendError, setup, user, refreshSetup, login, logout],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const state = useContext(AppContext)
  if (!state) {
    throw new Error('useApp must be used inside <AppProvider>')
  }
  return state
}
