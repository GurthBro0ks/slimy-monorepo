'use client'

import { useState } from 'react'
import { useChatAuth } from '@/lib/chat/auth-context'

export function ChatAuthForm() {
  const { login, register, isLoading, error } = useChatAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    try {
      if (isRegister) {
        await register(username, password, inviteCode)
      } else {
        await login(username, password)
      }
    } catch {
      // Error handled by context
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 font-mono">
      <div className="w-full max-w-md border-2 border-emerald-500/30 bg-[#12121a] p-8 rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.1)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-500 tracking-tighter mb-2">
            SLIMY_CHAT
          </h1>
          <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full" />
          <p className="mt-4 text-emerald-500/60 text-xs uppercase tracking-widest">
            {isRegister ? 'Initialize Access' : 'Secure Entry'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-emerald-500/50 text-[10px] uppercase font-bold mb-1 ml-1">
              Operator Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-emerald-500/20 rounded-md px-4 py-2 text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
              placeholder="user_id"
              required
            />
          </div>

          <div>
            <label className="block text-emerald-500/50 text-[10px] uppercase font-bold mb-1 ml-1">
              Access Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-emerald-500/20 rounded-md px-4 py-2 text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-emerald-500/50 text-[10px] uppercase font-bold mb-1 ml-1">
                Authorization Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-black/50 border border-emerald-500/20 rounded-md px-4 py-2 text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
                placeholder="INV-XXXX-XXXX"
                required
              />
            </div>
          )}

          {(error || localError) && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded">
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? 'PROCESSING...' : (isRegister ? 'REGISTER_ACCOUNT' : 'AUTHENTICATE')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-emerald-500/10 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-emerald-500/40 hover:text-emerald-500 text-[10px] uppercase tracking-wider transition-colors"
          >
            {isRegister ? 'Existing Operator? Sign In' : 'New Operator? Request Access'}
          </button>
        </div>

        <div className="mt-6 text-[8px] text-emerald-500/20 text-center font-bold tracking-[0.2em] uppercase">
          SlimyAI Secure Communications Protocol v2.0
        </div>
      </div>
    </div>
  )
}
