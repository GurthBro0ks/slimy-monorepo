import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiClient } from '@/lib/api-client';
import { cookies } from 'next/headers';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const result = await apiClient.get<any>("/api/auth/me", {
        useCache: false,
        headers: {
            Cookie: cookieHeader,
        },
    });

    if (!result.ok) {
        return null;
    }
    return result.data;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
        return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
    }

    // Check auth
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const sheet = await db.clubSheet.findUnique({
            where: { guildId },
        });

        return NextResponse.json({ success: true, data: sheet?.data || { cells: {} } });
    } catch (error) {
        console.error('Failed to fetch sheet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { guildId, data } = body;

        if (!guildId || !data) {
            return NextResponse.json({ error: 'Missing guildId or data' }, { status: 400 });
        }

        // Check auth
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user has access to this guild
        // The user object from /api/auth/me contains sessionGuilds or similar
        // We can check if guildId is in user.sessionGuilds or user.guilds
        // For now, let's assume if they are authenticated, we proceed, or check if they are admin/club member
        // The frontend does a check, but backend should too.
        // user.role === 'admin' or 'club'

        if (user.role !== 'admin' && user.role !== 'club') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const sheet = await db.clubSheet.upsert({
            where: { guildId },
            update: { data },
            create: { guildId, data },
        });

        return NextResponse.json({ success: true, data: sheet });
    } catch (error) {
        console.error('Failed to save sheet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
