'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useChatState } from './hooks/useChatState';

type ChatContextType = ReturnType<typeof useChatState>;

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
    // Initialize with 'widget' mode as base, but it handles both now via context
    const chatState = useChatState('widget');

    return (
        <ChatContext.Provider value={chatState}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
}
