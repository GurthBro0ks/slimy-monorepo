/**
 * Session Management Helpers
 *
 * This module provides functions for validating user sessions and attaching
 * user information to Express requests. It supports the RBAC system with
 * role hierarchy: user < mod < admin.
 *
 * This is v1 of the session management system and can be extended with
 * additional features like refresh tokens, session invalidation, etc.
 */

import { Request, Response, NextFunction } from 'express';

// Import existing JWT and database utilities
const jwtLib = require('../../lib/jwt');
const database = require('./database');

/**
 * User information extracted from session
 */
export interface SessionUser {
  id: string;
  role: string;
  discordId?: string;
  username?: string;
  globalName?: string;
  avatar?: string;
}

/**
 * Extended Express Request with user property
 */
export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}

/**
 * Get user information from the request by validating the session cookie/JWT
 *
 * @param req - Express request object
 * @returns User object with id, role, and discordId, or null if not authenticated
 */
export async function getUserFromRequest(
  req: Request
): Promise<SessionUser | null> {
  try {
    // Extract JWT token from cookie
    const token = req.cookies?.[jwtLib.COOKIE_NAME];

    if (!token) {
      return null;
    }

    // Verify and decode JWT
    let decoded: any;
    try {
      decoded = jwtLib.verifySession(token);
    } catch (jwtError) {
      // Invalid or expired token
      console.warn('[session] JWT verification failed:', jwtError.message);
      return null;
    }

    // Extract user ID from JWT payload
    const userId = decoded.userId || decoded.id || decoded.sub;

    if (!userId) {
      console.warn('[session] No userId found in JWT payload');
      return null;
    }

    // Look up user in database
    const user = await database.findUserById(userId);

    if (!user) {
      console.warn('[session] User not found in database:', userId);
      return null;
    }

    // Return user with role information
    return {
      id: user.id,
      role: user.role || 'user', // Default to 'user' if role is not set
      discordId: user.discordId,
      username: user.username,
      globalName: user.globalName,
      avatar: user.avatar,
    };
  } catch (error) {
    console.error('[session] Error in getUserFromRequest:', error);
    return null;
  }
}

/**
 * Express middleware that requires user authentication
 *
 * Validates the session and attaches user information to req.user.
 * Returns 401 Unauthorized if no valid session is found.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function requireUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    // Attach user to request object for downstream middleware/handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('[session] Error in requireUser middleware:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check failed'
    });
  }
}
