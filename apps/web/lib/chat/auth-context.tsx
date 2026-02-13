// Chat authentication context - ISOLATED from other auth systems
'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

export interface ChatUser {
  id: string
  username: string
  role?: string
  avatarUrl?: string | null
}

interface ChatAuthContextType {
  user: ChatUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, inviteCode: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const ChatAuthContext = createContext<ChatAuthContextType | undefined>(undefined)

const TOKEN_KEY = 'slimy_chat_token'
const USER_KEY = 'slimy_chat_user'

export function ChatAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ChatUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load auth from localStorage on mount
  useEffect(() => {
    const loadAuth = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)
        
        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      } catch (err) {
        console.error('[Chat Auth] Failed to load stored auth:', err)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    loadAuth()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/chat/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || 'Login failed')
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (username: string, password: string, inviteCode: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/chat/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, inviteCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || 'Registration failed')
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/chat/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('[Chat Auth] Logout error:', err)
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setToken(null)
      setUser(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return

    try {
      const res = await fetch('/api/chat/auth/me', {
        headers: { 'Authorization': `Bearer ${storedToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      } else {
        await logout()
      }
    } catch (err) {
      console.error('[Chat Auth] Refresh failed:', err)
    }
  }, [logout])

  return (
    <ChatAuthContext.Provider value={{
      user,
      token,
      isLoading,
      error,
      login,
      register,
      logout,
      refresh
    }}>
      {children}
    </ChatAuthContext.Provider>
  )
}

export function useChatAuth() {
  const context = useContext(ChatAuthContext)
  if (context === undefined) {
    throw new Error('useChatAuth must be used within a ChatAuthProvider')
  }
  return context
}
