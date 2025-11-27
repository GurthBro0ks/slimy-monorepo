"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldAlert } from "lucide-react";
import { adminApiClient } from "@/lib/api/admin-client";

interface User {
    id: string;
    username: string;
    lastActiveGuildId?: string | null;
}

interface Guild {
    id: string;
    name: string;
    userRole?: 'ADMIN' | 'MEMBER';
}

interface Channel {
    channelId: string;
    channelName?: string;
    modes: Record<string, any>;
    allowlist: string[];
}

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [guild, setGuild] = useState<Guild | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Fetch User to get lastActiveGuildId
                const userRes = await adminApiClient.get<User>("/auth/me");
                if (!userRes.ok) throw new Error("Failed to fetch user");
                setUser(userRes.data);

                const guildId = userRes.data.lastActiveGuildId;
                if (!guildId) {
                    // No active guild, redirect to club
                    router.push("/club");
                    return;
                }

                // 2. Fetch Guild to check RBAC
                const guildRes = await adminApiClient.get<Guild>(`/guilds/${guildId}`);
                if (!guildRes.ok) throw new Error("Failed to fetch guild");

                if (guildRes.data.userRole !== 'ADMIN') {
                    // RBAC Fail
                    setError("PERMISSION_DENIED");
                    setLoading(false);
                    return;
                }
                setGuild(guildRes.data);

                // 3. Fetch Channels
                const channelsRes = await adminApiClient.get<{ channels: Channel[] }>(`/guilds/${guildId}/channels`);
                if (channelsRes.ok) {
                    setChannels(channelsRes.data.channels || []);
                }

            } catch (err) {
                console.error(err);
                setError("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [router]);

    const handleSaveChannels = async () => {
        if (!guild) return;
        setSaving(true);
        try {
            const res = await adminApiClient.put(`/guilds/${guild.id}/channels`, { channels });
            if (!res.ok) throw new Error("Failed to save channels");
            // Success feedback could go here
        } catch (err) {
            console.error(err);
            // Error feedback
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error === "PERMISSION_DENIED") {
        return (
            <div className="container max-w-2xl py-8">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Permission Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to access settings for this guild.
                        Only Administrators and Managers can view this page.
                    </AlertDescription>
                </Alert>
                <div className="mt-4">
                    <Button onClick={() => router.push("/club")}>Return to Club</Button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-8">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage configuration for <span className="font-semibold text-foreground">{guild?.name}</span>
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Channel Configuration</CardTitle>
                    <CardDescription>
                        Configure which channels the bot should be active in.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Placeholder for Channel Selector UI */}
                    <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                        <p>Channel Selector Component Placeholder</p>
                        <p className="text-sm mt-2">Loaded {channels.length} channels</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
