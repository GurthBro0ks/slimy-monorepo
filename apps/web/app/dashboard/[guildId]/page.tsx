import { cookies } from "next/headers";
import { notFound } from "next/navigation";

async function getGuild(guildId: string) {
    const cookieStore = await cookies();
    const res = await fetch(`http://127.0.0.1:3080/api/guilds/${guildId}`, {
        headers: {
            Cookie: cookieStore.toString(),
        },
        cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
}

export default async function GuildDashboardPage({ params }: { params: Promise<{ guildId: string }> }) {
    const { guildId } = await params;
    const guild = await getGuild(guildId);

    if (!guild) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{guild.name}</h1>
                <div className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500 border border-green-500/20">
                    🟢 Connected
                </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Agent Configuration</h2>
                <div className="h-32 rounded-md border border-dashed flex items-center justify-center text-muted-foreground bg-muted/50">
                    Placeholder: Agent Configuration
                </div>
            </div>
        </div>
    );
}
