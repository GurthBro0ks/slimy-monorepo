import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import {
  analyzeScreenshot,
  analyzeScreenshots,
  validateImageUrl,
  type ScreenshotAnalysisResult,
  type ScreenshotType,
  isValidScreenshotType
} from '@/lib/screenshot/analyzer';

// TODO: Import database client when implemented
// import { screenshotDatabase } from '@/lib/screenshot/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const screenshots = formData.getAll('screenshots') as File[];
    const imageUrls = formData.getAll('imageUrls') as string[];
    const screenshotType = formData.get('type') as string;
    const userId = formData.get('userId') as string;
    const analyze = formData.get('analyze') === 'true';
    const options = JSON.parse(formData.get('options') as string || '{}');

    // Validate inputs
    if (screenshots.length === 0 && imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'No screenshots or image URLs provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (screenshotType && !isValidScreenshotType(screenshotType)) {
      return NextResponse.json(
        { error: `Invalid screenshot type. Supported types: ${Object.keys(require('@/lib/screenshot/analyzer')).filter(k => k.endsWith('Templates')).join(', ')}` },
        { status: 400 }
      );
    }

    const allImageUrls: string[] = [...imageUrls];

    // Handle file uploads
    if (screenshots.length > 0) {
      // Create user-specific upload directory
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'screenshots', userId);
      await mkdir(uploadDir, { recursive: true });

      for (const file of screenshots) {
        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const extension = file.name.split('.').pop() || 'png';
        const filename = `${timestamp}_${randomId}.${extension}`;
        const filepath = join(uploadDir, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Create public URL
        const imageUrl = `/uploads/screenshots/${userId}/${filename}`;
        allImageUrls.push(`${request.nextUrl.origin}${imageUrl}`);
      }
    }

    // Validate all image URLs
    const validationPromises = allImageUrls.map(url => validateImageUrl(url));
    const validationResults = await Promise.all(validationPromises);

    const validUrls = allImageUrls.filter((_, index) => validationResults[index]);
    const invalidUrls = allImageUrls.filter((_, index) => !validationResults[index]);

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid image URLs provided' },
        { status: 400 }
      );
    }

    let analysisResults: ScreenshotAnalysisResult[] = [];
    const analysisOptions = {
      type: screenshotType as ScreenshotType,
      ...options
    };

    // Analyze screenshots if requested
    if (analyze && validUrls.length > 0) {
      try {
        if (validUrls.length === 1) {
          const result = await analyzeScreenshot(validUrls[0], analysisOptions);
          analysisResults = [result];
        } else {
          analysisResults = await analyzeScreenshots(validUrls, analysisOptions);
        }
      } catch (error) {
        console.error('Analysis failed:', error);
        // Don't fail the entire request if analysis fails
      }
    }

    // TODO: Store results in database
    // This will be implemented when database models are created

    const response = {
      success: true,
      uploaded: screenshots.length,
      processed: validUrls.length,
      analyzed: analysisResults.length,
      results: analysisResults,
      summary: {
        totalImages: allImageUrls.length,
        validImages: validUrls.length,
        invalidImages: invalidUrls.length,
        analyzedImages: analysisResults.length,
        averageConfidence: analysisResults.length > 0
          ? analysisResults.reduce((sum, r) => sum + r.metadata.confidence, 0) / analysisResults.length
          : 0,
        screenshotType: screenshotType || 'custom'
      },
      warnings: invalidUrls.length > 0 ? [`${invalidUrls.length} image(s) could not be accessed`] : []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error processing screenshot request:', error);
    return NextResponse.json(
      { error: 'Internal server error during processing' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve screenshot analyses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as ScreenshotType;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (type && !isValidScreenshotType(type)) {
      return NextResponse.json(
        { error: 'Invalid screenshot type' },
        { status: 400 }
      );
    }

    // TODO: Retrieve results from database with filtering
    // This will be implemented when database models are created

    // Placeholder response
    return NextResponse.json({
      success: true,
      results: [],
      pagination: {
        total: 0,
        limit,
        offset,
        hasMore: false
      },
      filters: {
        userId,
        type,
        search,
        tags
      },
      message: 'Database integration pending - use POST to analyze screenshots'
    });

  } catch (error) {
    console.error('Error retrieving screenshot analyses:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve screenshot analyses' },
      { status: 500 }
    );
  }
}
