import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { analyzeClubScreenshots } from '@/lib/club/vision';
import { requireAuth } from '@/lib/auth/server';
import { AuthenticationError } from '@/lib/errors';

// Maximum file size: 10MB per file
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication to prevent anonymous uploads
    await requireAuth(request);

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

    // SECURITY: Sanitize guildId to prevent path traversal attacks
    // Only allow alphanumeric characters, hyphens, and underscores
    const sanitizedGuildId = guildId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedGuildId || sanitizedGuildId !== guildId) {
      return NextResponse.json(
        { error: 'Invalid guild ID format' },
        { status: 400 }
      );
    }

    // SECURITY: Validate guild access
    // TODO: Add guild membership check via apiClient
    // For now, we trust that authenticated users should have some access control

    // SECURITY: Limit number of files
    if (screenshots.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    // Create guild-specific upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'club', sanitizedGuildId);
    await mkdir(uploadDir, { recursive: true });

    // Process and store uploaded files
    const uploadedFiles = [];
    const imageUrls = [];

    for (const file of screenshots) {
      // SECURITY: Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // SECURITY: Validate file type (images only)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has invalid type. Only images allowed.` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      // SECURITY: Sanitize extension - only allow known image extensions
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const safeExtension = allowedExtensions.includes(extension) ? extension : 'png';
      const filename = `${timestamp}_${randomId}.${safeExtension}`;
      const filepath = join(uploadDir, filename);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Create public URL using sanitized guildId
      const imageUrl = `/uploads/club/${sanitizedGuildId}/${filename}`;

      uploadedFiles.push({
        name: file.name,
        size: file.size,
        storedName: filename,
        url: imageUrl,
        status: 'uploaded',
      });

      imageUrls.push(`${request.nextUrl.origin}${imageUrl}`);
    }

    let analysisResults: any[] = [];

    // Optionally trigger analysis
    if (analyze && imageUrls.length > 0) {
      try {
        analysisResults = await analyzeClubScreenshots(imageUrls);
      } catch (error) {
        console.error('Analysis failed:', error);
        // Don't fail the upload if analysis fails
        analysisResults = [];
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
    // Handle authentication errors specifically
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    console.error('Error uploading screenshots:', error);
    return NextResponse.json(
      { error: 'Failed to upload screenshots' },
      { status: 500 }
    );
  }
}
