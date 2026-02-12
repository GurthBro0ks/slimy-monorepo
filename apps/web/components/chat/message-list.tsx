// Message List Component
'use client'

import { useRef, useEffect } from 'react'

interface User {
  id: string
  username: string
}

interface Reaction {
  id: string
  emoji: string
  user: User
}

interface Message {
  id: string
  text: string
  createdAt: string
  editedAt?: string | null
  user: User
  reactions?: Reaction[]
}

interface MessageListProps {
  messages: Message[]
  currentUserId?: string
  onReactionAdd?: (messageId: string, emoji: string) => void
  onReactionRemove?: (messageId: string, emoji: string) => void
}

export function MessageList({ messages, currentUserId, onReactionAdd, onReactionRemove }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-emerald-500/50 text-sm font-mono py-8">
          No messages yet. Start the conversation!
        </div>
      ) : (
        Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="h-px bg-emerald-500/20 flex-1" />
              <span className="px-3 text-xs text-emerald-500/40 font-mono">
                {formatDate(dateMessages[0].createdAt)}
              </span>
              <div className="h-px bg-emerald-500/20 flex-1" />
            </div>

            {/* Messages for this date */}
            <div className="space-y-3">
              {dateMessages.map(msg => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isOwn={msg.user.id === currentUserId}
                  formatTime={formatTime}
                  onReactionAdd={onReactionAdd}
                  onReactionRemove={onReactionRemove}
                />
              ))}
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}

interface MessageItemProps {
  message: Message
  isOwn: boolean
  formatTime: (dateStr: string) => string
  onReactionAdd?: (messageId: string, emoji: string) => void
  onReactionRemove?: (messageId: string, emoji: string) => void
}

function MessageItem({ message, isOwn, formatTime, onReactionAdd, onReactionRemove }: MessageItemProps) {
  // Group reactions by emoji
  const reactionGroups = message.reactions?.reduce((groups, reaction) => {
    if (!groups[reaction.emoji]) {
      groups[reaction.emoji] = []
    }
    groups[reaction.emoji].push(reaction)
    return groups
  }, {} as Record<string, Reaction[]>)

  return (
    <div className={`group flex gap-3 px-2 py-1.5 rounded hover:bg-emerald-500/5 transition-colors ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-9 h-9 rounded bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 flex items-center justify-center text-emerald-400 text-sm font-bold shrink-0">
        {message.user.username[0].toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`flex items-baseline gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className={`font-medium text-sm ${isOwn ? 'text-emerald-400' : 'text-emerald-300'}`}>
            {message.user.username}
          </span>
          <span className="text-emerald-500/40 text-xs font-mono">
            {formatTime(message.createdAt)}
            {message.editedAt && <span className="ml-1">(edited)</span>}
          </span>
        </div>
        <p className="text-emerald-200/90 text-sm break-words font-mono leading-relaxed">
          {message.text}
        </p>

        {/* Reactions */}
        {reactionGroups && Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Object.entries(reactionGroups).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => {
                  const hasReacted = reactions.some(r => r.user.id === 'current') // Simplified check
                  if (hasReacted && onReactionRemove) {
                    onReactionRemove(message.id, emoji)
                  } else if (onReactionAdd) {
                    onReactionAdd(message.id, emoji)
                  }
                }}
                className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded text-xs transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-emerald-400/70">{reactions.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
