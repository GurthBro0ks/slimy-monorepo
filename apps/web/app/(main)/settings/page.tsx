"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login?returnTo=/settings");
            return;
        }
        if (isAuthenticated) {
            setLoading(false);
        }
    }, [isAuthenticated, isLoading, router]);

    if (loading || isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-purple-400">Settings</h1>

            <Card className="bg-[#1a0b2e] border-purple-800">
                <CardHeader>
                    <CardTitle className="text-white">Account Settings</CardTitle>
                    <CardDescription className="text-purple-300">
                        Manage your slimy-auth account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-purple-300">Username</label>
                            <p className="text-lg text-white">{user?.username || "Unknown"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-purple-300">Role</label>
                            <p className="text-lg text-white capitalize">{user?.role || "member"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-purple-300">User ID</label>
                            <p className="text-lg text-white font-mono text-sm">{user?.id || "Unknown"}</p>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-purple-900/30 rounded-lg border border-purple-700">
                        <h3 className="text-white font-semibold mb-2">Note</h3>
                        <p className="text-purple-300 text-sm">
                            Discord OAuth has been removed. Your account is now managed via email/password authentication through slimy-auth.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
