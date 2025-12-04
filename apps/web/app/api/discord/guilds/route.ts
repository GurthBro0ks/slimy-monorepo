import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiClient } from '@/lib/api-client';
import { requireAuth } from '@/lib/auth/server';
import { errorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verify authentication - this should allow any authenticated user (admin, club, or member)
    const user = await requireAuth();

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const result = await apiClient.get('/api/discord/guilds', {
      useCache: false,
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!result.ok) {
      console.error('[/api/discord/guilds] Backend returned error:', {
        status: result.status,
        code: result.code,
        message: result.message,
        userId: user.id,
        role: user.role,
      });

      // If backend returns 401/403, return a more helpful message
      if (result.status === 401 || result.status === 403) {
        return NextResponse.json(
          {
            error: 'Unable to fetch Discord guilds',
            message: 'Your session may have expired or you may not have the required permissions.',
            guilds: []
          },
          { status: 200 } // Return 200 to avoid breaking the UI
        );
      }

      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return NextResponse.json(body, { status, headers });
  }
}
