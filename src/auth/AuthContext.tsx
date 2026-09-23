import { createContext, useContext, useState, ReactNode } from 'react'

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
    () => sessionStorage.getItem(KEY) === '1'
  )

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
    setIsAuthed(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthed, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
