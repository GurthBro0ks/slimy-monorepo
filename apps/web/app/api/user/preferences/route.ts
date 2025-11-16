/**
 * User Preferences API Route
 *
 * GET    /api/user/preferences - Get user preferences
 * PATCH  /api/user/preferences - Update user preferences
 * DELETE /api/user/preferences - Delete user preferences
 */

import { NextRequest } from 'next/server';
import {
  createAPIRoute,
  successResponse,
  parseRequestBody,
  checkMethod,
} from '@/lib/api-error-handler';
import { AuthenticationError } from '@/lib/errors';
import { getUserPreferencesRepository } from '@/lib/repositories/user-preferences.repository';
import { userPreferencesSchema } from '@/lib/validation/schemas';

// GET /api/user/preferences - Get user preferences
export const GET = createAPIRoute(async (request: NextRequest) => {
  // Check authentication (you'll need to implement this based on your auth system)
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new AuthenticationError('User not authenticated');
  }

  const repository = getUserPreferencesRepository();
  const preferences = await repository.getOrCreate(userId);

  return successResponse(preferences);
});

// PATCH /api/user/preferences - Update user preferences
export const PATCH = createAPIRoute(async (request: NextRequest) => {
  checkMethod(request, ['PATCH']);

  // Check authentication
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new AuthenticationError('User not authenticated');
  }

  // Parse and validate request body
  const body = await parseRequestBody(request, userPreferencesSchema);

  // Update preferences
  const repository = getUserPreferencesRepository();
  const preferences = await repository.update(userId, body.preferences);

  return successResponse(preferences);
});

// DELETE /api/user/preferences - Delete user preferences
export const DELETE = createAPIRoute(async (request: NextRequest) => {
  checkMethod(request, ['DELETE']);

  // Check authentication
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new AuthenticationError('User not authenticated');
  }

  // Delete preferences
  const repository = getUserPreferencesRepository();
  await repository.delete(userId);

  return successResponse({ deleted: true });
});
