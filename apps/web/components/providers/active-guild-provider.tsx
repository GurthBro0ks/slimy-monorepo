"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/lib/auth/context";

interface ActiveGuild {
    id: string;
    name: string;
    icon: string | null;
}

interface ActiveGuildContextType {
    activeGuild: ActiveGuild | null;
    setActiveGuild: (guild: ActiveGuild | null) => void;
    isLoading: boolean;
}

const ActiveGuildContext = createContext<ActiveGuildContextType | undefined>(undefined);

export function ActiveGuildProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: authLoading } = useAuth();
    const [activeGuild, setActiveGuild] = useState<ActiveGuild | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (user?.lastActiveGuild && !activeGuild && !isInitialized) {
            setActiveGuild(user.lastActiveGuild);
            setIsInitialized(true);
        } else if (!user) {
            setActiveGuild(null);
            setIsInitialized(false);
        } else if (user && !isInitialized) {
            // User loaded but no lastActiveGuild, just mark initialized
            setIsInitialized(true);
        }
    }, [user, authLoading, activeGuild, isInitialized]);

    return (
        <ActiveGuildContext.Provider
            value={{
                activeGuild,
                setActiveGuild,
                isLoading: authLoading,
            }}
        >
            {children}
        </ActiveGuildContext.Provider>
    );
}

export function useActiveGuild() {
    const context = useContext(ActiveGuildContext);
    if (context === undefined) {
        throw new Error("useActiveGuild must be used within an ActiveGuildProvider");
    }
    return context;
}
