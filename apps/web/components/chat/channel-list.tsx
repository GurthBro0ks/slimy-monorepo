// Channel List Component
'use client'

import { useState, useEffect } from 'react'

interface Channel {
  id: string
  name: string
  topic: string | null
}

interface ChannelListProps {
  activeChannelId: string | null
  onSelectChannel: (channel: Channel) => void
}

export function ChannelList({ activeChannelId, onSelectChannel }: ChannelListProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const token = localStorage.getItem('slimy_chat_token')
      const res = await fetch('/api/chat/channels', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        if (res.status === 401) {
          // Token invalid, clear it
          localStorage.removeItem('slimy_chat_token')
          localStorage.removeItem('slimy_chat_user')
          window.location.href = '/trader/login?redirect=/chat'
          return
        }
        throw new Error('Failed to fetch channels')
      }

      const data = await res.json()
      setChannels(data.channels || [])
      // Select first channel if none selected
      if (data.channels?.length > 0 && !activeChannelId) {
        onSelectChannel(data.channels[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-emerald-500/50 text-sm font-mono">
        Loading channels...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-sm font-mono">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1">
      <div className="px-2 py-1 text-xs font-bold text-emerald-500/50 uppercase tracking-wider">
        Channels
      </div>
      {channels.map(channel => (
        <button
          key={channel.id}
          onClick={() => onSelectChannel(channel)}
          className={`w-full text-left px-3 py-2 rounded text-sm font-mono transition-all ${
            activeChannelId === channel.id
              ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500'
              : 'text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10'
          }`}
        >
          <span className="text-emerald-500/50 mr-1">#</span>
          {channel.name}
        </button>
      ))}
    </div>
  )
}
