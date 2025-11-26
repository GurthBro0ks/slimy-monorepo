"use client";

import { useAuth } from "@/hooks/useAuth";
import { LazySlimeChatBar } from "@/components/lazy";

export function AuthenticatedChatBar() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) return null;

    return <LazySlimeChatBar />;
}
