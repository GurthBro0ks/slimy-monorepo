"use client";

import { CommandShell } from "@/components/CommandShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <CommandShell title="Settings" breadcrumbs="Home / Settings" statusText="System Status: Online">
            <div className="container mx-auto p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Manage your application preferences.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Settings configuration coming soon...</p>
                    </CardContent>
                </Card>
            </div>
        </CommandShell>
    );
}
