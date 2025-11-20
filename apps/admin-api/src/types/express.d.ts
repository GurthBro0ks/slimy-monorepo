/**
 * Type definitions for Express request/response extensions
 * These augment the Express Request and Response objects with custom properties
 */

import { Request, Response } from 'express';

declare global {
  namespace Express {
    /**
     * User object attached to request after authentication
     */
    interface User {
      id: string;
      discordId: string;
      username: string;
      globalName: string;
      avatar: string | null;
      role: 'member' | 'club' | 'admin';
      guilds: Array<{
        id: string;
        name: string;
        icon: string | null;
        owner: boolean;
        permissions: string;
      }>;
      csrfToken: string;
    }

    /**
     * Extended Request interface with custom properties
     */
    interface Request {
      // User from authentication middleware
      user?: User;

      // Request ID for tracing
      id?: string;

      // Logger instance
      logger?: any;

      // Validated data from validation middleware
      validated?: {
        body?: any;
        query?: any;
        params?: any;
      };

      // CSRF token
      csrfToken?: string;

      // File upload info
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        buffer: Buffer;
        size: number;
      };

      // Guild access check results
      guildAccess?: {
        hasAccess: boolean;
        role?: string;
        permissions?: string;
      };
    }

    /**
     * Extended Response interface
     */
    interface Response {
      // Success response helper
      success?: (data: any, statusCode?: number) => Response;

      // Error response helper
      error?: (message: string, code?: string, statusCode?: number) => Response;
    }
  }
}

export {};
