import { NextRequest, NextResponse } from 'next/server';
import { analyzeClubScreenshot, analyzeClubScreenshots, validateImageUrl, type ClubAnalysisResult } from '@/lib/club/vision';
import { clubDatabase } from '@/lib/club/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrls, guildId, userId, options } = body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one image URL is required' },
        { status: 400 }
      );
    }

    if (!guildId) {
      return NextResponse.json(
        { error: 'Guild ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate all image URLs
    const validationPromises = imageUrls.map(url => validateImageUrl(url));
    const validationResults = await Promise.all(validationPromises);

    const validUrls = imageUrls.filter((_, index) => validationResults[index]);
    const invalidUrls = imageUrls.filter((_, index) => !validationResults[index]);

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid image URLs provided' },
        { status: 400 }
      );
    }

    // Analyze screenshots
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
      return NextResponse.json(
        { error: 'Failed to analyze images with AI' },
        { status: 500 }
      );
    }

    // Store results in database
    const storedResults = [];
    for (const result of results) {
      try {
        const stored = await clubDatabase.storeAnalysis(guildId, userId, result, [result.imageUrl]);
        storedResults.push(stored);
      } catch (error) {
        console.error('Failed to store analysis result:', error);
        // Continue with other results even if one fails to store
      }
    }

    return NextResponse.json({
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
    console.error('Error in club analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error during analysis' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve stored analysis results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!guildId) {
      return NextResponse.json(
        { error: 'Guild ID is required' },
        { status: 400 }
      );
    }

    // Retrieve results from database
    const results = await clubDatabase.getAnalysesByGuild(guildId, limit, offset);

    return NextResponse.json({
      success: true,
      results,
      pagination: {
        total: results.length, // TODO: Implement proper count query
        limit,
        offset,
        hasMore: results.length === limit
      }
    });

  } catch (error) {
    console.error('Error retrieving analysis results:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analysis results' },
      { status: 500 }
    );
  }
}
