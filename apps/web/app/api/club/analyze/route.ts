import { NextRequest } from 'next/server';
import { analyzeClubScreenshot, analyzeClubScreenshots, validateImageUrl, type ClubAnalysisResult } from '@/lib/club/vision';
import { clubDatabase } from '@/lib/club/database';
import { requireAuth } from '@/lib/auth/server';
import { validateGuildAccess, sanitizeGuildId } from '@/lib/auth/permissions';
import { ValidationError, errorResponse } from '@/lib/errors';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // STEP 1: Parse request data
    const body = await request.json();
    const { imageUrls, guildId: rawGuildId, options } = body;

    // STEP 2: Validate ALL inputs BEFORE authentication
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new ValidationError('At least one image URL is required');
    }

    if (!rawGuildId) {
      throw new ValidationError('Guild ID is required');
    }

    // STEP 2a: Sanitize guildId to prevent injection attacks
    const guildId = sanitizeGuildId(rawGuildId);

    // Validate all image URLs
    const validationPromises = imageUrls.map(url => validateImageUrl(url));
    const validationResults = await Promise.all(validationPromises);

    const validUrls = imageUrls.filter((_, index) => validationResults[index]);
    const invalidUrls = imageUrls.filter((_, index) => !validationResults[index]);

    if (validUrls.length === 0) {
      throw new ValidationError('No valid image URLs provided');
    }

    // STEP 3: Authenticate user (throws AuthenticationError if invalid)
    const user = await requireAuth();

    // STEP 4: Validate user has access to this guild
    validateGuildAccess(user, guildId);

    // SECURITY: Use authenticated user's ID, not client-provided userId
    const userId = user.id;

    // STEP 4: Execute business logic - Analyze screenshots
    let results: ClubAnalysisResult[];
    try {
      if (validUrls.length === 1) {
        const result = await analyzeClubScreenshot(validUrls[0], options);
        results = [result];
      } else {
        results = await analyzeClubScreenshots(validUrls, options);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      throw error; // Re-throw to be handled by centralized error handler
    }

    // STEP 6: Store results in database
    const storedResults = [];

    for (const result of results) {
      try {
        const stored = await clubDatabase.storeAnalysis(
          guildId,
          userId,
          result,
          [result.imageUrl]
        );
        storedResults.push(stored);
      } catch (error) {
        console.error('Failed to store analysis result:', error);
        // Continue with other results even if one fails to store
      }
    }

    return Response.json({
      success: true,
      results: storedResults,
      summary: {
        totalImages: imageUrls.length,
        validImages: validUrls.length,
        invalidImages: invalidUrls.length,
        analyzedImages: results.length,
        storedResults: storedResults.length,
        averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      },
      warnings: invalidUrls.length > 0 ? [`${invalidUrls.length} image(s) could not be accessed`] : []
    });

  } catch (error) {
    // Handle all errors through centralized error handler
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}

// GET endpoint to retrieve stored analysis results
export async function GET(request: NextRequest) {
  try {
    // STEP 1: Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawGuildId = searchParams.get('guildId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // STEP 2: Validate inputs BEFORE authentication
    if (!rawGuildId) {
      throw new ValidationError('Guild ID is required');
    }

    // STEP 2a: Sanitize guildId
    const guildId = sanitizeGuildId(rawGuildId);

    // STEP 3: Authenticate user (throws AuthenticationError if invalid)
    const user = await requireAuth();

    // STEP 4: Validate that authenticated user has access to this guild
    validateGuildAccess(user, guildId);

    // STEP 5: Execute business logic - Retrieve results from database
    const results = await clubDatabase.getAnalysesByGuild(guildId, limit, offset);
    const totalCount = await clubDatabase.countAnalysesByGuild(guildId);

    return Response.json({
      success: true,
      results,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount,
      }
    });

  } catch (error) {
    // Handle all errors through centralized error handler
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}
