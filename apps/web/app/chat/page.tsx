// Chat Page - integrates chat into slimy-monorepo web app
import { ChatAuthProvider } from '@/lib/chat/auth-context'
import { ChatLoginGate } from '@/components/chat/login-gate'
import { ChatLayout } from '@/components/chat/chat-layout'
import { ChatSocketProvider } from '@/lib/chat/socket-context'

export const metadata = {
  title: 'Chat | SlimyAI',
  description: 'Real-time isolated chat system',
}

export default function ChatPage() {
  return (
    <ChatAuthProvider>
      <ChatLoginGate>
        <ChatSocketProvider>
          <ChatLayout />
        </ChatSocketProvider>
      </ChatLoginGate>
    </ChatAuthProvider>
  )
}
