import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { analyzeClubScreenshots } from '@/lib/club/vision';
import { requireAuth } from '@/lib/auth/server';
import { validateGuildAccess, sanitizeGuildId } from '@/lib/auth/permissions';
import { ValidationError, errorResponse } from '@/lib/errors';

// Maximum file size: 10MB per file
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;

export async function POST(request: NextRequest) {
  try {
    // STEP 1: Parse request data
    const formData = await request.formData();
    const screenshots = formData.getAll('screenshots') as File[];
    const rawGuildId = formData.get('guildId') as string;
    const analyze = formData.get('analyze') === 'true';

    // STEP 2: Validate inputs BEFORE authentication
    if (screenshots.length === 0) {
      throw new ValidationError('No screenshots provided');
    }

    if (!rawGuildId) {
      throw new ValidationError('Guild ID is required');
    }

    // STEP 2a: SECURITY: Sanitize guildId to prevent path traversal attacks
    // Only allow alphanumeric characters, hyphens, and underscores
    const guildId = sanitizeGuildId(rawGuildId);

    // SECURITY: Limit number of files
    if (screenshots.length > MAX_FILES) {
      throw new ValidationError(`Maximum ${MAX_FILES} files allowed`);
    }

    // Validate individual files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of screenshots) {
      if (file.size > MAX_FILE_SIZE) {
        throw new ValidationError(
          `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
        );
      }

      if (!allowedTypes.includes(file.type)) {
        throw new ValidationError(
          `File ${file.name} has invalid type. Only images allowed.`
        );
      }
    }

    // STEP 3: Authenticate user (throws AuthenticationError if invalid)
    const user = await requireAuth();

    if (!user) {
      throw new ValidationError('Authentication required');
    }

    // STEP 4: Validate user has access to this guild
    validateGuildAccess(user, guildId);

    // STEP 5: Execute business logic
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
    // Handle all errors through centralized error handler
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}
