// Chat Login Gate - redirects to login if not authenticated
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface LoginGateProps {
  children: React.ReactNode
}

export function ChatLoginGate({ children }: LoginGateProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for chat token
    const checkAuth = () => {
      const token = localStorage.getItem('slimy_chat_token')
      if (!token) {
        // Redirect to trader login page
        router.push('/trader/login?redirect=/chat')
      } else {
        setIsAuthenticated(true)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex items-center gap-2 text-emerald-500">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono">Loading chat...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}
