"use client";

import { createContext, useContext, ReactNode } from "react";

interface ChatContextValue {
  // Placeholder - actual implementation needed
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  return <ChatContext.Provider value={{}}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}