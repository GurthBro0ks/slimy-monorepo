// Chat Page - integrates chat into slimy-monorepo web app
import { ChatLoginGate } from '@/components/chat/login-gate'
import { ChatLayout } from '@/components/chat/chat-layout'
import { ChatSocketProvider } from '@/lib/chat/socket-context'

export const metadata = {
  title: 'Chat | SlimyAI',
  description: 'Real-time chat for traders',
}

export default function ChatPage() {
  return (
    <ChatLoginGate>
      <ChatSocketProvider>
        <ChatLayout />
      </ChatSocketProvider>
    </ChatLoginGate>
  )
}
