import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

/**
 * Holds the signed-in user and exposes the auth actions.
 * The session lives in an httpOnly cookie, so we ask the server who we are on
 * mount and whenever the tab regains focus.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  const refresh = useCallback(async () => {
    try {
      const data = await api.me()
      setUser(data?.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setStatus('ready')
    }
  }, [])

  useEffect(() => {
    refresh()

    function onFocus() {
      refresh()
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const signup = useCallback(async (details) => {
    const data = await api.signup(details)
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: Boolean(user),
      signup,
      login,
      logout,
      refresh,
    }),
    [user, status, signup, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
