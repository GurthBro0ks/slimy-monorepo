import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Clone the URL to preserve query parameters (code, state, etc.)
    const targetUrl = request.nextUrl.clone();

    // Redirect to the API route which is proxied to the backend
    targetUrl.pathname = '/api/auth/discord/callback';

    return NextResponse.redirect(targetUrl);
}
