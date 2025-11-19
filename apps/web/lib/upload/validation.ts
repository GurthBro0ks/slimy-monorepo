/**
 * File upload validation utilities
 * Provides security checks for file size and MIME types
 */

// Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_REQUEST = 20;

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/**
 * Validation error types
 */
export class FileValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'FileValidationError';
  }
}

/**
 * Validate a single file
 */
export function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError(
      `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      'file_too_large',
      { filename: file.name, size: file.size, maxSize: MAX_FILE_SIZE }
    );
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new FileValidationError(
      `File "${file.name}" has unsupported type "${file.type}". Allowed types: ${Array.from(ALLOWED_IMAGE_TYPES).join(', ')}`,
      'unsupported_type',
      { filename: file.name, type: file.type, allowedTypes: Array.from(ALLOWED_IMAGE_TYPES) }
    );
  }

  // Additional validation: check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const expectedExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/jpg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
  };

  const allowedExtensions = expectedExtensions[file.type];
  if (allowedExtensions && extension && !allowedExtensions.includes(extension)) {
    throw new FileValidationError(
      `File "${file.name}" has extension "${extension}" that doesn't match MIME type "${file.type}"`,
      'extension_mismatch',
      { filename: file.name, extension, mimeType: file.type }
    );
  }
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): void {
  // Check file count
  if (files.length > MAX_FILES_PER_REQUEST) {
    throw new FileValidationError(
      `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files allowed per request`,
      'too_many_files',
      { count: files.length, maxCount: MAX_FILES_PER_REQUEST }
    );
  }

  // Validate each file
  for (const file of files) {
    validateFile(file);
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = MAX_FILE_SIZE * 5; // Allow up to 50MB total
  if (totalSize > maxTotalSize) {
    throw new FileValidationError(
      `Total upload size exceeds maximum of ${maxTotalSize / 1024 / 1024}MB`,
      'total_size_exceeded',
      { totalSize, maxTotalSize }
    );
  }
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
}

/**
 * Get safe file extension
 */
export function getSafeExtension(filename: string, defaultExt: string = 'png'): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  return ext && allowedExtensions.includes(ext) ? ext : defaultExt;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
