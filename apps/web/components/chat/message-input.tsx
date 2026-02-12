// Message Input Component
'use client'

import { useState, useRef, useEffect } from 'react'

interface MessageInputProps {
  channelName?: string
  disabled?: boolean
  onSendMessage: (text: string) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
}

export function MessageInput({
  channelName,
  disabled,
  onSendMessage,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || disabled) return

    onSendMessage(text.trim())
    setText('')

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      onTypingStop?.()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without shift for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)

    // Typing indicator logic
    if (!isTyping && newText.length > 0) {
      setIsTyping(true)
      onTypingStart?.()
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        onTypingStop?.()
      }
    }, 2000)

    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const charCount = text.length
  const maxChars = 4000

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-emerald-500/20 bg-[#0f0f14]">
      <div className="flex gap-3 items-end">
        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={channelName ? `Message #${channelName}` : 'Type a message...'}
            disabled={disabled}
            rows={1}
            maxLength={maxChars}
            className="w-full px-4 py-3 bg-[#1a1a24] border border-emerald-500/30 rounded-lg text-emerald-100 placeholder-emerald-500/40 font-mono text-sm resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
          {/* Character count */}
          <div className={`absolute bottom-2 right-3 text-xs font-mono ${
            charCount > maxChars * 0.9 ? 'text-red-400' : 'text-emerald-500/30'
          }`}>
            {charCount}/{maxChars}
          </div>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="px-5 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/50 rounded-lg text-emerald-400 font-mono text-sm transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9" />
          </svg>
          Send
        </button>
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-emerald-500/30 font-mono flex items-center justify-between">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {isTyping && <span className="text-emerald-400/50">Typing...</span>}
      </div>
    </form>
  )
}
