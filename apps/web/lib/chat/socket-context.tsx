// Socket.io context for chat - adapted for slimy-monorepo
'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinChannel: (channelId: string) => void
  leaveChannel: (channelId: string) => void
  sendMessage: (channelId: string, text: string) => void
  startTyping: (channelId: string) => void
  stopTyping: (channelId: string) => void
  addReaction: (messageId: string, emoji: string) => void
  removeReaction: (messageId: string, emoji: string) => void
  sendDM: (toUserId: string, text: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: ReactNode
}

// Token key used for chat authentication
const TOKEN_KEY = 'slimy_chat_token'

export function ChatSocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      console.log('[Socket] No token found, skipping connection')
      return
    }

    // Create socket connection
    const socketInstance = io({
      path: '/socket.io',
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message)
      setIsConnected(false)
    })

    // Error handling
    socketInstance.on('error', (error: { code: string; message: string }) => {
      console.error('[Socket] Server error:', error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const joinChannel = useCallback((channelId: string) => {
    if (socket && isConnected) {
      socket.emit('channel:join', { channelId })
    }
  }, [socket, isConnected])

  const leaveChannel = useCallback((channelId: string) => {
    if (socket && isConnected) {
      socket.emit('channel:leave', { channelId })
    }
  }, [socket, isConnected])

  const sendMessage = useCallback((channelId: string, text: string) => {
    if (socket && isConnected) {
      socket.emit('message:send', { channelId, text })
    } else {
      console.warn('[Socket] Cannot send message - not connected')
    }
  }, [socket, isConnected])

  const startTyping = useCallback((channelId: string) => {
    if (socket && isConnected) {
      socket.emit('typing:start', { channelId })
    }
  }, [socket, isConnected])

  const stopTyping = useCallback((channelId: string) => {
    if (socket && isConnected) {
      socket.emit('typing:stop', { channelId })
    }
  }, [socket, isConnected])

  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (socket && isConnected) {
      socket.emit('reaction:add', { messageId, emoji })
    }
  }, [socket, isConnected])

  const removeReaction = useCallback((messageId: string, emoji: string) => {
    if (socket && isConnected) {
      socket.emit('reaction:remove', { messageId, emoji })
    }
  }, [socket, isConnected])

  const sendDM = useCallback((toUserId: string, text: string) => {
    if (socket && isConnected) {
      socket.emit('dm:send', { toUserId, text })
    }
  }, [socket, isConnected])

  const value: SocketContextType = {
    socket,
    isConnected,
    joinChannel,
    leaveChannel,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    removeReaction,
    sendDM,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useChatSocket(): SocketContextType {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useChatSocket must be used within a ChatSocketProvider')
  }
  return context
}
