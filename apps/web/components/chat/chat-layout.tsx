// Main Chat Layout Component
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChannelList } from './channel-list'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { useChatSocket } from '@/lib/chat/socket-context'

interface Channel {
  id: string
  name: string
  topic: string | null
}

interface User {
  id: string
  username: string
  role?: string
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

export function ChatLayout() {
  const router = useRouter()
  const { socket, isConnected, joinChannel, leaveChannel, sendMessage, startTyping, stopTyping, addReaction } = useChatSocket()

  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  // Load current user
  useEffect(() => {
    const userStr = localStorage.getItem('slimy_chat_user')
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr))
      } catch {
        // Invalid user data
        localStorage.removeItem('slimy_chat_token')
        localStorage.removeItem('slimy_chat_user')
        router.push('/trader/login?redirect=/chat')
      }
    }
  }, [router])

  // Fetch messages when channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id)
      joinChannel(activeChannel.id)
    }

    return () => {
      if (activeChannel) {
        leaveChannel(activeChannel.id)
      }
    }
  }, [activeChannel?.id, joinChannel, leaveChannel])

  // Socket message handling
  useEffect(() => {
    if (!socket) return

    const handleMessageCreated = (message: Message) => {
      setMessages(prev => {
        // Remove any temp messages for this text/user combo, then add the real one
        const filtered = prev.filter(m => !m.id.startsWith('temp-') || m.text !== message.text)
        // Also avoid exact duplicate
        if (filtered.some(m => m.id === message.id)) return filtered
        return [...filtered, message]
      })
    }

    const handleMessageEdited = (data: { messageId: string; text: string; editedAt: string }) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === data.messageId
            ? { ...m, text: data.text, editedAt: data.editedAt }
            : m
        )
      )
    }

    const handleReactionAdded = (data: { messageId: string; emoji: string; userId: string; username: string }) => {
      setMessages(prev =>
        prev.map(m => {
          if (m.id !== data.messageId) return m
          const reactions = m.reactions || []
          const exists = reactions.some(r => r.emoji === data.emoji && r.user.id === data.userId)
          if (exists) return m
          return {
            ...m,
            reactions: [...reactions, { id: `temp-${Date.now()}`, emoji: data.emoji, user: { id: data.userId, username: data.username } }],
          }
        })
      )
    }

    const handleReactionRemoved = (data: { messageId: string; emoji: string; userId: string }) => {
      setMessages(prev =>
        prev.map(m => {
          if (m.id !== data.messageId) return m
          return {
            ...m,
            reactions: m.reactions?.filter(r => !(r.emoji === data.emoji && r.user.id === data.userId)) || [],
          }
        })
      )
    }

    socket.on('message:created', handleMessageCreated)
    socket.on('message:edited', handleMessageEdited)
    socket.on('reaction:added', handleReactionAdded)
    socket.on('reaction:removed', handleReactionRemoved)

    return () => {
      socket.off('message:created', handleMessageCreated)
      socket.off('message:edited', handleMessageEdited)
      socket.off('reaction:added', handleReactionAdded)
      socket.off('reaction:removed', handleReactionRemoved)
    }
  }, [socket])

  const fetchMessages = useCallback(async (channelId: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('slimy_chat_token')
      const res = await fetch(`/api/chat/channels/${channelId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('slimy_chat_token')
          localStorage.removeItem('slimy_chat_user')
          router.push('/trader/login?redirect=/chat')
          return
        }
        throw new Error('Failed to fetch messages')
      }

      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleSendMessage = useCallback((text: string) => {
    if (!activeChannel) return

    // Optimistic add for immediate display
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      text,
      createdAt: new Date().toISOString(),
      user: currentUser || { id: tempId, username: 'You' },
    }
    setMessages(prev => [...prev, optimisticMessage])

    // Send via Socket.io
    sendMessage(activeChannel.id, text)
  }, [activeChannel, currentUser, sendMessage])

  const handleSelectChannel = useCallback((channel: Channel) => {
    setActiveChannel(channel)
    setMessages([]) // Clear messages when switching channels
    setIsSidebarOpen(false) // Close sidebar on mobile after selection
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('slimy_chat_token')
    localStorage.removeItem('slimy_chat_user')
    router.push('/trader/login')
  }

  return (
    <div className="h-screen flex bg-[#0a0a0f]" data-swipe-enabled="true">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden touch-none"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#111118] border-r border-emerald-500/20 flex-col transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:flex
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          setTouchStart({ x: touch.clientX, y: touch.clientY })
        }}
        onTouchMove={(e) => {
          if (!touchStart.x) return
          const touch = e.touches[0]
          const diff = touchStart.x - touch.clientX
          if (diff > 100) setIsSidebarOpen(false)
        }}
        onTouchEnd={() => setTouchStart(null)}
      >
        {/* Mobile Sidebar Header */}
        <div className="lg:hidden p-4 pt-6 border-b border-emerald-500/20 flex items-center justify-between">
          <h2 className="text-emerald-400 font-bold text-lg font-mono">Channels</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-emerald-500/50 hover:text-emerald-300 transition-colors rounded"
          >
            {/* Icon #1 - Chevron left */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>
        {/* Guild Header */}
        <div className="p-4 border-b border-emerald-500/20 pt-4">
          <h2 className="text-emerald-400 font-bold text-lg font-mono">The Lounge</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-emerald-500/50 text-xs font-mono">
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto py-2">
          <ChannelList
            activeChannelId={activeChannel?.id || null}
            onSelectChannel={handleSelectChannel}
          />
        </div>

        {/* User Panel */}
        <div className="p-3 border-t border-emerald-500/20 bg-[#0d0d12]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500/40 to-emerald-700/40 rounded-full flex items-center justify-center text-emerald-300 font-bold text-sm">
              {currentUser?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-emerald-300 text-sm font-medium font-mono truncate">
                  {currentUser?.username || 'Unknown'}
                </span>
                {currentUser?.role === 'owner' && <span className="text-purple-400 text-xs">👑</span>}
                {currentUser?.role === 'admin' && <span className="text-blue-400 text-xs">⚙</span>}
              </div>
              <div className="flex items-center gap-2 text-emerald-500/40 text-xs font-mono">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span>{isConnected ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-emerald-500/50 hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Channel Header */}
        <div className="h-16 border-b border-emerald-500/20 bg-[#111118] px-4 flex items-center gap-3">
          {/* Channel Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-emerald-500/50 hover:text-emerald-300 transition-colors rounded hover:bg-emerald-500/10"
          >
            {/* Icon #1 - List */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-emerald-400 font-bold font-mono block">
              # {activeChannel?.name || 'Select a channel'}
            </span>
            {activeChannel?.topic && (
              <span className="text-emerald-500/50 text-xs font-mono block truncate">
                {activeChannel.topic}
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 bg-[#0a0a0f]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-2 text-emerald-500/50">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-mono">Loading messages...</span>
              </div>
            </div>
          ) : (
            <MessageList
              messages={messages}
              currentUserId={currentUser?.id}
              onReactionAdd={addReaction}
            />
          )}
        </div>

        {/* Message Input */}
        <MessageInput
          channelName={activeChannel?.name}
          disabled={!activeChannel || !isConnected}
          onSendMessage={handleSendMessage}
          onTypingStart={() => activeChannel && startTyping(activeChannel.id)}
          onTypingStop={() => activeChannel && stopTyping(activeChannel.id)}
        />
      </div>
    </div>
  )
}
