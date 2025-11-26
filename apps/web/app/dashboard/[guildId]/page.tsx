import { cookies } from "next/headers";

type Guild = {
    id?: string;
    name?: string;
    icon?: string | null;
};

// Fetch guild from admin-api but fail open so server components don't crash on upstream issues
async function getGuild(guildId: string): Promise<Guild | null> {
    if (!guildId) return null;

    let cookieHeader = "";

    try {
        const cookieStore = await cookies();
        cookieHeader = typeof cookieStore?.toString === "function" ? cookieStore.toString() : "";
    } catch (error) {
        console.error("[dashboard] unable to read cookies for guild fetch", { error });
    }

    try {
        const res = await fetch(`http://127.0.0.1:3080/api/guilds/${guildId}`, {
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
            cache: "no-store",
        });

        if (!res.ok) {
            console.error(`[dashboard] failed to load guild ${guildId}`, { status: res.status });
            return null;
        }

        return res.json();
    } catch (error) {
        console.error(`[dashboard] error loading guild ${guildId}`, { error });
        return null;
    }
}

const fallbackMessage = "We could not load this guild right now. Please retry in a moment.";

export default async function GuildDashboardPage({ params }: { params: { guildId: string } }) {
    const guildId = params?.guildId;
    const guild = await getGuild(guildId);

    if (!guild) {
        return <GuildDashboardFallback guildId={guildId} />;
    }

    const guildName = guild.name || "Guild";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{guildName}</h1>
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

function GuildDashboardFallback({ guildId }: { guildId?: string }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Guild dashboard</h1>
                <div className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-500 border border-yellow-500/20">
                    ⚠️ Limited
                </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-2">Unable to load guild</h2>
                <p className="text-sm text-muted-foreground">{fallbackMessage}</p>
                {guildId ? (
                    <p className="mt-3 text-xs text-muted-foreground">Guild ID: {guildId}</p>
                ) : null}
            </div>
        </div>
    );
}
