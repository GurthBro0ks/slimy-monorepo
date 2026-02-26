import { NextRequest, NextResponse } from "next/server";

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type DiscordUserProfile = {
  id: string;
  username: string;
  global_name?: string;
  email?: string;
  avatar?: string;
};

function getRedirectUri(request: NextRequest): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (baseUrl) {
    return `${baseUrl}/api/auth/discord/callback`;
  }

  const origin = request.nextUrl.origin.replace(/\/$/, "");
  return `${origin}/api/auth/discord/callback`;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!code) {
    console.error("Discord callback missing authorization code");
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  if (!clientId || !clientSecret) {
    console.error("Discord OAuth credentials not configured");
    return NextResponse.redirect(new URL("/?error=discord_config", request.url));
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: getRedirectUri(request),
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Failed to exchange Discord code:", errorText);
      return NextResponse.redirect(new URL("/?error=token_exchange_failed", request.url));
    }

    const tokens = (await tokenResponse.json()) as DiscordTokenResponse;
    if (!tokens.access_token) {
      console.error("Discord token payload missing access_token");
      return NextResponse.redirect(new URL("/?error=missing_access_token", request.url));
    }

    const userProfileResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userProfileResponse.ok) {
      const errorText = await userProfileResponse.text();
      console.error("Failed to fetch Discord user profile:", errorText);
      return NextResponse.redirect(new URL("/?error=user_fetch_failed", request.url));
    }

    const userProfile = (await userProfileResponse.json()) as DiscordUserProfile;
    console.log("LOGGED IN USER:", userProfile);

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("slime_session_temp", userProfile.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Discord OAuth callback failed:", error);
    return NextResponse.redirect(new URL("/?error=discord_callback_error", request.url));
  }
}

