/**
 * Club Sheet API Route
 *
 * GET  /api/club/sheet?guildId=xxx - Load club sheet data
 * POST /api/club/sheet              - Save club sheet data
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth/server';
import { validateGuildAccess } from '@/lib/auth/permissions';
import { getClubSheetRepository } from '@/lib/repositories/club-sheet.repository';

/**
 * GET /api/club/sheet
 *
 * Returns the club sheet data for a specific guild.
 * If no sheet exists, returns an empty sheet object.
 */
export async function GET(request: NextRequest) {
  try {
    // STEP 1: Authenticate user
    const cookieStore = cookies();
    const user = await requireAuth(cookieStore);
    if (!user || !user.id) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // STEP 2: Extract guildId from query params
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'MISSING_GUILD_ID',
          message: 'Guild ID is required',
        },
        { status: 400 }
      );
    }

    // STEP 3: Validate user has access to this guild
    validateGuildAccess(user, guildId);

    // STEP 4: Get or create sheet data
    const repository = getClubSheetRepository();
    const sheet = await repository.getOrCreate(guildId);

    return NextResponse.json({
      ok: true,
      data: sheet.data,
      updatedAt: sheet.updatedAt,
    });
  } catch (error) {
    console.error('[ClubSheetAPI] Error in GET /api/club/sheet:', error);

    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/club/sheet
 *
 * Saves club sheet data for a specific guild.
 */
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Authenticate user
    const cookieStore = cookies();
    const user = await requireAuth(cookieStore);
    if (!user || !user.id) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // STEP 2: Parse request body
    const body = await request.json();
    const { guildId, data } = body;

    if (!guildId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'MISSING_GUILD_ID',
          message: 'Guild ID is required',
        },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          code: 'MISSING_DATA',
          message: 'Sheet data is required',
        },
        { status: 400 }
      );
    }

    // STEP 3: Validate user has access to this guild
    validateGuildAccess(user, guildId);

    // STEP 4: Upsert sheet data
    const repository = getClubSheetRepository();
    const sheet = await repository.upsert(guildId, data);

    return NextResponse.json({
      ok: true,
      data: sheet.data,
      updatedAt: sheet.updatedAt,
    });
  } catch (error) {
    console.error('[ClubSheetAPI] Error in POST /api/club/sheet:', error);

    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
