'use client'

import { useChatAuth } from '@/lib/chat/auth-context'
import { ChatAuthForm } from './auth-form'

interface LoginGateProps {
  children: React.ReactNode
}

export function ChatLoginGate({ children }: LoginGateProps) {
  const { user, isLoading } = useChatAuth()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex items-center gap-2 text-emerald-500">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono">Verifying credentials...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <ChatAuthForm />
  }

  return <>{children}</>
}
