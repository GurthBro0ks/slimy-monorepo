"use client";

import { useState, useEffect, useRef } from "react";
import { X, Menu, Send } from "lucide-react";
import Image from "next/image";
import { SlimeChatUserList } from "./slime-chat-user-list";

interface Message {
  id: string;
  username: string;
  content: string;
  timestamp: Date;
  userColor: string;
}

interface SlimeChatWindowProps {
  onClose: () => void;
  isMobile: boolean;
}

export function SlimeChatWindow({ onClose, isMobile }: SlimeChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TODO: Connect to MCP chat service
  useEffect(() => {
    // Placeholder messages for demonstration
    const demoMessages: Message[] = [
      {
        id: "1",
        username: "Alex",
        content: "Hello!",
        timestamp: new Date(),
        userColor: "#06b6d4", // cyan
      },
      {
        id: "2",
        username: "Brooke",
        content: "Hi there!",
        timestamp: new Date(),
        userColor: "#ec4899", // magenta
      },
      {
        id: "3",
        username: "Chris",
        content: "How's it going?",
        timestamp: new Date(),
        userColor: "#eab308", // yellow
      },
    ];
    setMessages(demoMessages);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // TODO: Send message via MCP chat service
    const newMessage: Message = {
      id: Date.now().toString(),
      username: "You",
      content: inputValue,
      timestamp: new Date(),
      userColor: "#10b981", // green
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div 
      className={`fixed bottom-0 ${
        isMobile ? 'left-[10%] right-[10%]' : 'right-4 w-[35%]'
      } bg-zinc-900 border-2 border-emerald-500 rounded-t-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] z-50`}
      style={{ height: isMobile ? '70vh' : '500px' }}
    >
      {/* Header */}
      <div className="bg-zinc-800 border-b border-emerald-500/30 px-4 py-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-3">
          {/* Slimy.ai Logo */}
          <div className="relative w-6 h-6">
            <Image
              src="/images/logo.svg"
              alt="slimy.ai"
              fill
              className="object-contain"
            />
          </div>
          
          {/* slime.chat Text */}
          <span className="text-emerald-500 font-semibold text-lg">
            slime.chat
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Hamburger Menu for User List */}
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="p-2 hover:bg-zinc-700 rounded transition-colors"
            aria-label="Toggle user list"
          >
            <Menu className="w-5 h-5 text-emerald-500" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-emerald-500" />
          </button>
        </div>
      </div>

      {/* User List Dropdown */}
      {showUserList && (
        <SlimeChatUserList onClose={() => setShowUserList(false)} />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100% - 120px)' }}>
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-3">
            {/* User Avatar */}
            <div 
              className="w-8 h-8 rounded flex-shrink-0"
              style={{ backgroundColor: message.userColor }}
            />
            
            {/* Message Content */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span 
                  className="font-semibold text-sm"
                  style={{ color: message.userColor }}
                >
                  {message.username}
                </span>
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-white text-sm mt-1">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-emerald-500/30 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg border border-emerald-500/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-500"
          />
          <button
            onClick={handleSendMessage}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
