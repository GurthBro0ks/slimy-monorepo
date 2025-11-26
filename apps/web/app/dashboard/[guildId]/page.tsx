import { cookies } from "next/headers";

type Guild = {
    id?: string;
    name?: string;
    icon?: string | null;
};

type GuildResult =
    | { success: true; guild: Guild }
    | { success: false; error: 'not-found' | 'access-denied' | 'server-error'; status?: number };

// Fetch guild from admin-api with detailed error states for better UX
async function getGuild(guildId: string): Promise<GuildResult> {
    if (!guildId) {
        return { success: false, error: 'not-found', status: 400 };
    }

    let cookieHeader = "";

    try {
        const cookieStore = await cookies();
        cookieHeader = typeof cookieStore?.toString === "function" ? cookieStore.toString() : "";
    } catch (error) {
        console.error("[dashboard] unable to read cookies for guild fetch", { error });
        // Continue without cookies - the backend will handle auth
    }

    try {
        // Use Next.js API route which properly proxies to admin-api
        // This ensures correct base URL resolution in all environments (dev/prod/Docker)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/guilds/${guildId}`, {
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
            cache: "no-store",
        });

        if (!res.ok) {
            console.error(`[dashboard] failed to load guild ${guildId}`, { status: res.status });

            // Map HTTP status codes to specific error types
            if (res.status === 404) {
                return { success: false, error: 'not-found', status: 404 };
            } else if (res.status === 401 || res.status === 403) {
                return { success: false, error: 'access-denied', status: res.status };
            } else {
                return { success: false, error: 'server-error', status: res.status };
            }
        }

        const guild = await res.json();
        return { success: true, guild };
    } catch (error) {
        console.error(`[dashboard] error loading guild ${guildId}`, { error });
        return { success: false, error: 'server-error' };
    }
}

export default async function GuildDashboardPage({ params }: { params: Promise<{ guildId: string }> }) {
    const { guildId } = await params;
    const result = await getGuild(guildId);

    if (!result.success) {
        return <GuildDashboardFallback guildId={guildId} error={result.error} status={result.status} />;
    }

    const guild = result.guild;

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

function GuildDashboardFallback({
    guildId,
    error,
    status
}: {
    guildId?: string;
    error: 'not-found' | 'access-denied' | 'server-error';
    status?: number;
}) {
    // Provide specific, actionable error messages based on the error type
    const errorMessages = {
        'not-found': {
            title: 'Guild not found',
            message: 'This guild does not exist or has not been connected yet. Try connecting it from the guilds list.',
            action: 'Go to Guilds',
            actionHref: '/dashboard',
        },
        'access-denied': {
            title: 'Access denied',
            message: 'You do not have permission to view this guild. Make sure you are logged in with the correct account.',
            action: 'Re-login',
            actionHref: '/api/auth/discord/login',
        },
        'server-error': {
            title: 'Server error',
            message: 'We encountered an error loading this guild. Please try again in a moment.',
            action: 'Retry',
            actionHref: `/dashboard/${guildId}`,
        },
    };

    const { title, message, action, actionHref } = errorMessages[error];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Guild dashboard</h1>
                <div className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-500 border border-yellow-500/20">
                    ⚠️ {error === 'access-denied' ? 'Access Denied' : error === 'not-found' ? 'Not Found' : 'Error'}
                </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-2">{title}</h2>
                <p className="text-sm text-muted-foreground mb-4">{message}</p>

                <a
                    href={actionHref}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                >
                    {action}
                </a>

                {guildId && (
                    <div className="mt-6 pt-4 border-t">
                        <p className="text-xs text-muted-foreground">Guild ID: {guildId}</p>
                        {status && <p className="text-xs text-muted-foreground">Status: {status}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
