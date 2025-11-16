'use client';

import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'group relative max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-neon-green text-zinc-900'
            : 'bg-zinc-800 text-zinc-100'
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs opacity-60">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          <button
            onClick={handleCopy}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            title="Copy message"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
