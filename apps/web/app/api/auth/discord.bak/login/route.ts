import { NextRequest, NextResponse } from "next/server";

const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const SCOPES = ["identify", "email", "guilds"];

function getRedirectUri(request: NextRequest): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (baseUrl) {
    return `${baseUrl}/api/auth/discord/callback`;
  }

  // Fallback to the incoming request origin to stay functional in previews
  const origin = request.nextUrl.origin.replace(/\/$/, "");
  return `${origin}/api/auth/discord/callback`;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!clientId) {
    console.error("Missing DISCORD_CLIENT_ID for Discord OAuth login");
    return NextResponse.json(
      { error: "Discord OAuth not configured" },
      { status: 500 },
    );
  }

  const redirectUri = getRedirectUri(request);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    prompt: "consent",
  });

  const authorizeUrl = `${DISCORD_AUTHORIZE_URL}?${params.toString()}`;
  return NextResponse.redirect(authorizeUrl);
}

