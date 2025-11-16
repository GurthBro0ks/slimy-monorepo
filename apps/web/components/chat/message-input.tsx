'use client';

import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Shift+Enter for new line)"
        disabled={disabled}
        className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green disabled:opacity-50"
        rows={3}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        size="icon"
        className="h-auto bg-neon-green text-zinc-900 hover:bg-neon-green/90"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
