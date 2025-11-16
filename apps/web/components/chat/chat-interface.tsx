'use client';

import { useChat } from '@/hooks/use-chat';
import { MessageBubble } from './message-bubble';
import { MessageInput } from './message-input';
import { PersonalitySelector } from './personality-selector';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Callout } from '@/components/ui/callout';

export function ChatInterface() {
  const {
    messages,
    currentMode,
    isLoading,
    error,
    sendMessage,
    setPersonalityMode,
    clearConversation,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col gap-4">
      {/* Personality Mode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-400">Personality Mode</h3>
          <PersonalitySelector
            currentMode={currentMode}
            onModeChange={setPersonalityMode}
            disabled={isLoading}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearConversation}
          disabled={isLoading || messages.length === 0}
          className="border-red-500/30 text-red-500 hover:bg-red-500/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Chat
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <h3 className="text-lg font-medium text-zinc-300">
                Start a conversation
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Choose a personality mode and send a message to begin chatting with Slimy.ai
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start p-4">
                <div className="flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
                  <span className="text-sm text-zinc-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Callout variant="error" className="text-sm">
          {error}
        </Callout>
      )}

      {/* Message Input */}
      <MessageInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
