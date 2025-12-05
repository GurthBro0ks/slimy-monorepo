"use client";

import { useAuth } from "@/hooks/useAuth";
import { LazyRetroChatWidget } from "@/components/lazy";

export function AuthenticatedChatBar() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) return null;

    return <LazyRetroChatWidget />;
}
