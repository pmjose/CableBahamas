import { createContext, useContext, useState, ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

// In live mode the app runs inside Snowflake SPCS; Snowflake sign-in already
// authenticated the user, so the demo password gate is skipped.
const LIVE = import.meta.env.VITE_CHAT_MODE === 'live'

const PASSWORD = 'CableBahamas2026'
const KEY = 'cablebahamas_authed'

type AuthCtx = {
  isAuthed: boolean
  login: (pw: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean>(
    () => LIVE || sessionStorage.getItem(KEY) === '1'
  )
  const { pathname } = useLocation()

  const login = (pw: string) => {
    if (pw === PASSWORD) {
      sessionStorage.setItem(KEY, '1')
      setIsAuthed(true)
      return true
    }
    return false
  }

  const logout = () => {
    sessionStorage.removeItem(KEY)
    if (!LIVE) setIsAuthed(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthed, login, logout }}>
      {LIVE && pathname === '/' ? <Navigate to="/landing" replace /> : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
