"use client";

import { useState, useEffect } from "react";
import { ChevronUp, X, Menu } from "lucide-react";
import Image from "next/image";
import { SlimeChatWindow } from "./slime-chat-window";

export function SlimeChatBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // TODO: Connect to MCP chat service for real unread count
  useEffect(() => {
    // Placeholder for MCP integration
    // This will be replaced with actual WebSocket connection
    setUnreadCount(3);
  }, []);

  const toggleChat = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setUnreadCount(0); // Clear notifications when opening
    }
  };

  return (
    <>
      {/* Expanded Chat Window */}
      {isExpanded && (
        <SlimeChatWindow 
          onClose={() => setIsExpanded(false)}
          isMobile={isMobile}
        />
      )}

      {/* Collapsed Chat Bar */}
      {!isExpanded && (
        <div 
          className={`fixed bottom-0 ${
            isMobile ? 'left-[10%] right-[10%]' : 'right-4 w-[35%]'
          } z-50`}
        >
          <button
            onClick={toggleChat}
            className="w-full bg-zinc-900 border-2 border-emerald-500 rounded-t-xl px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
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

            <div className="flex items-center gap-3">
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
              
              {/* Expand Arrow */}
              <ChevronUp className="w-5 h-5 text-emerald-500" />
            </div>
          </button>
        </div>
      )}
    </>
  );
}
