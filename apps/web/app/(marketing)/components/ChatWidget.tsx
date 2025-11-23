'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Message = { from: 'bot' | 'user'; text: string };

type ChatWidgetProps = {
  open: boolean;
  onClose: () => void;
};

export function ChatWidget({ open, onClose }: ChatWidgetProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Welcome to slimy.ai — ready to drip into your workflow?' },
    { from: 'bot', text: 'Ask me about guardrails, multi-agent routing, or the neon UI kit.' },
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && isAuthenticated) inputRef.current?.focus();
  }, [open, isAuthenticated]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { from: 'user', text: input.trim() }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'bot', text: 'Noted. Dropping a neon agent into your stack.' }]);
    }, 450);
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div
      className={`chat-interface${open ? ' open' : ''}`}
      aria-hidden={!open}
    >
      <div className="chat-titlebar" data-test-id="chat-titlebar">
        <span>slimy_chat.exe</span>
        <button className="ghost-button" type="button" onClick={onClose}>
          ✕
        </button>
      </div>
      {isLoading ? (
        <div className="chat-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>
        </div>
      ) : !isAuthenticated ? (
        <div className="chat-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Sign in to chat with Slimy</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Login to access the live chat feature</p>
          </div>
          <button className="primary-button" onClick={handleLogin}>
            Login to Chat
          </button>
        </div>
      ) : (
        <>
          <div className="chat-body" ref={listRef}>
            {messages.map((message, idx) => (
              <div key={`${message.from}-${idx}`} className={`chat-message ${message.from}`}>
                {message.text}
              </div>
            ))}
          </div>
          <form className="chat-input-row" onSubmit={send}>
            <input
              data-test-id="chat-input"
              className="chat-input"
              type="text"
              placeholder="Type like it's 1999..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              ref={inputRef}
            />
            <button data-test-id="chat-send" className="primary-button" type="submit">
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default ChatWidget;
