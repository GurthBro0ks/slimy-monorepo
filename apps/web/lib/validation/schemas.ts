/**
 * API Request Validation Schemas
 *
 * Centralized Zod schemas for validating API requests
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */

// ID validation
export const idSchema = z.string().min(1, 'ID is required');

// Pagination schemas
export const paginationSchema = z.object({
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0),
});

// Search schema
export const searchSchema = z.object({
  q: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
});

/**
 * Codes API Schemas
 */

export const codesQuerySchema = z.object({
  scope: z.enum(['active', 'past7', 'all']).optional().default('active'),
  q: z.string().optional(),
  metadata: z.string().optional().transform((val) => val === 'true'),
  health: z.string().optional().transform((val) => val === 'true'),
});

export const reportCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  reason: z.enum(['expired', 'invalid', 'duplicate', 'other']),
  details: z.string().optional(),
});

/**
 * Chat API Schemas
 */

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  conversationId: z.string().optional(),
  personalityMode: z.enum(['helpful', 'sarcastic', 'professional', 'creative', 'technical']).optional(),
});

export const chatUserSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1).max(100),
});

/**
 * Guild API Schemas
 */

export const guildListQuerySchema = paginationSchema.merge(searchSchema).merge(z.object({
  includeMembers: z.string().optional().transform((val) => val === 'true'),
}));

export const createGuildSchema = z.object({
  name: z.string().min(1, 'Guild name is required').max(100, 'Guild name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  iconUrl: z.string().url('Invalid icon URL').optional(),
});

export const updateGuildSchema = createGuildSchema.partial();

export const guildSettingsSchema = z.object({
  autoModeration: z.boolean().optional(),
  welcomeMessage: z.string().max(1000).optional(),
  prefix: z.string().max(10).optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh']).optional(),
});

export const guildFlagsSchema = z.object({
  theme: z.object({
    colorPrimary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex').optional(),
    badgeStyle: z.enum(['rounded', 'square', 'pill']).optional(),
  }).optional(),
  experiments: z.object({
    ensembleOCR: z.boolean().optional(),
    secondApprover: z.boolean().optional(),
    askManus: z.boolean().optional(),
    publicStats: z.boolean().optional(),
  }).optional(),
});

/**
 * Club Analytics Schemas
 */

export const uploadScreenshotSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  fileName: z.string().min(1),
  fileSize: z.number().positive().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export const analyzeScreenshotSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1, 'At least one image required').max(5, 'Maximum 5 images'),
  guildId: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().max(200).optional(),
});

export const exportAnalysisSchema = z.object({
  analysisId: z.string().min(1),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
});

/**
 * Screenshot Analysis Schemas
 */

export const screenshotAnalysisSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  analysisType: z.enum(['club', 'stats', 'general']).optional().default('general'),
  extractMetrics: z.boolean().optional().default(true),
});

/**
 * Snail Tools Schemas
 */

export const snailHistoryQuerySchema = paginationSchema.merge(z.object({
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}));

export const updateSnailHistorySchema = z.object({
  userId: z.string().min(1),
  tier: z.number().int().min(0).max(100),
  timestamp: z.string().datetime().optional(),
});

/**
 * Stats API Schemas
 */

export const statsQuerySchema = z.object({
  guildId: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
  metric: z.enum(['messages', 'users', 'commands', 'all']).optional().default('all'),
});

/**
 * User Preferences Schemas (for future implementation)
 */

export const userPreferencesSchema = z.object({
  userId: z.string().min(1),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.enum(['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh']).optional(),
    notifications: z.boolean().optional(),
    chatPersonality: z.enum(['helpful', 'sarcastic', 'professional', 'creative', 'technical']).optional(),
  }),
});

/**
 * Type exports for TypeScript
 */

export type CodesQuery = z.infer<typeof codesQuerySchema>;
export type ReportCode = z.infer<typeof reportCodeSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;
export type CreateGuild = z.infer<typeof createGuildSchema>;
export type UpdateGuild = z.infer<typeof updateGuildSchema>;
export type GuildSettings = z.infer<typeof guildSettingsSchema>;
export type GuildFlags = z.infer<typeof guildFlagsSchema>;
export type UploadScreenshot = z.infer<typeof uploadScreenshotSchema>;
export type AnalyzeScreenshot = z.infer<typeof analyzeScreenshotSchema>;
export type ExportAnalysis = z.infer<typeof exportAnalysisSchema>;
export type ScreenshotAnalysis = z.infer<typeof screenshotAnalysisSchema>;
export type SnailHistoryQuery = z.infer<typeof snailHistoryQuerySchema>;
export type UpdateSnailHistory = z.infer<typeof updateSnailHistorySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
