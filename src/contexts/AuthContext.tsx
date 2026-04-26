import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { lookupPlayer, normalise } from '@/lib/playerRegistry'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  loginWithPhone: (phone: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'badminton_auth_user'
const USERS_KEY = 'badminton_users'

function getStoredUsers(): Record<string, User> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function persistUser(user: User) {
  const users = getStoredUsers()
  users[user.phone] = user
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {
      // ignore
    }
    setIsLoading(false)
  }, [])

  const loginWithPhone = async (phone: string): Promise<User> => {
    const key = normalise(phone)
    const registered = await lookupPlayer(key)
    if (!registered) throw new Error('NOT_REGISTERED')

    const users = getStoredUsers()
    let user = users[key]
    if (!user) {
      user = { id: crypto.randomUUID(), phone: key, name: registered.name, createdAt: new Date().toISOString() }
    } else {
      // Keep name in sync with registry
      user = { ...user, name: registered.name }
    }

    persistUser(user)
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithPhone, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
