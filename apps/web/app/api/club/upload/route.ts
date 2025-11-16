import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { analyzeClubScreenshots } from '@/lib/club/vision';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const screenshots = formData.getAll('screenshots') as File[];
    const guildId = formData.get('guildId') as string;
    const analyze = formData.get('analyze') === 'true';

    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: 'No screenshots provided' },
        { status: 400 }
      );
    }

    if (!guildId) {
      return NextResponse.json(
        { error: 'Guild ID is required' },
        { status: 400 }
      );
    }

    // Create guild-specific upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'club', guildId);
    await mkdir(uploadDir, { recursive: true });

    // Process and store uploaded files
    const uploadedFiles = [];
    const imageUrls = [];

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
      const imageUrl = `/uploads/club/${guildId}/${filename}`;

      uploadedFiles.push({
        name: file.name,
        size: file.size,
        storedName: filename,
        url: imageUrl,
        status: 'uploaded',
      });

      imageUrls.push(`${request.nextUrl.origin}${imageUrl}`);
    }

    let analysisResults = null;

    // Optionally trigger analysis
    if (analyze && imageUrls.length > 0) {
      try {
        analysisResults = await analyzeClubScreenshots(imageUrls);
      } catch (error) {
        console.error('Analysis failed:', error);
        // Don't fail the upload if analysis fails
      }
    }

    const response = {
      success: true,
      uploaded: uploadedFiles.length,
      files: uploadedFiles,
      analysisTriggered: analyze,
      analysisResults: analysisResults,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error uploading screenshots:', error);
    return NextResponse.json(
      { error: 'Failed to upload screenshots' },
      { status: 500 }
    );
  }
}
