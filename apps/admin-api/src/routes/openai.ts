/**
 * OpenAI Routes
 *
 * Handles OpenAI chat requests with:
 * - Request validation
 * - Per-user rate limiting
 * - Streaming responses
 * - Error handling
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { askOpenAI } from '../../../../lib/openai/client';
import { getOpenAIQueue } from '../../../../lib/openai/queue';

const router = express.Router();

// Request validation schema
const askRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant', 'function']),
      content: z.string(),
      name: z.string().optional(),
    })
  ).min(1, 'At least one message is required'),
  functions: z.array(
    z.object({
      type: z.literal('function'),
      function: z.object({
        name: z.string(),
        description: z.string().optional(),
        parameters: z.record(z.any()).optional(),
      }),
    })
  ).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
});

/**
 * POST /api/ask
 *
 * Submit a chat request to OpenAI with streaming response
 *
 * Request body:
 *   - messages: Array of chat messages (required)
 *   - functions: Array of function definitions (optional)
 *   - model: Model name (optional, defaults to gpt-4)
 *   - temperature: Temperature (optional, 0-2)
 *   - maxTokens: Max tokens (optional, 1-4000)
 *
 * Response:
 *   - Server-Sent Events stream of chat completion chunks
 *
 * Headers:
 *   - X-RateLimit-Limit: Max requests per window
 *   - X-RateLimit-Remaining: Remaining requests
 *   - X-RateLimit-Reset: Reset timestamp
 *
 * Errors:
 *   - 400: Invalid request body
 *   - 401: Unauthorized (no user in session)
 *   - 429: Rate limit exceeded
 *   - 500: Internal server error
 */
router.post('/ask', async (req: Request, res: Response) => {
  try {
    // Get user ID from request (assuming auth middleware adds it)
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required',
      });
      return;
    }

    // Validate request body
    const parseResult = askRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Request body validation failed',
        details: parseResult.error.errors,
      });
      return;
    }

    const { messages, functions, model, temperature, maxTokens } = parseResult.data;

    // Check rate limit
    const queue = await getOpenAIQueue();
    const rateLimitResult = await queue.enqueueRequest(userId);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetAt.toString());

    if (!rateLimitResult.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
        resetAt: rateLimitResult.resetAt,
      });
      return;
    }

    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get streaming response from OpenAI
    const stream = await askOpenAI(messages, functions, {
      model,
      temperature,
      maxTokens,
    });

    // Stream chunks to client
    let chunkCount = 0;
    for await (const chunk of stream) {
      // Check if client disconnected
      if (req.destroyed) {
        console.log('[openai-route] Client disconnected, stopping stream');
        break;
      }

      // Send chunk as SSE
      const data = JSON.stringify(chunk);
      res.write(`data: ${data}\n\n`);
      chunkCount++;
    }

    // Send completion marker
    res.write('data: [DONE]\n\n');
    res.end();

    console.log(`[openai-route] Streamed ${chunkCount} chunks to user ${userId}`);
  } catch (error: any) {
    console.error('[openai-route] Error processing request:', error);

    // If headers not sent, send error response
    if (!res.headersSent) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      });
    } else {
      // Stream error event
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

/**
 * GET /api/rate-limit
 *
 * Check current rate limit status for the authenticated user
 *
 * Response:
 *   - allowed: Whether new requests are allowed
 *   - remaining: Remaining requests in current window
 *   - resetAt: Timestamp when rate limit resets
 */
router.get('/rate-limit', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required',
      });
      return;
    }

    const queue = await getOpenAIQueue();
    const rateLimitResult = await queue.checkRateLimit(userId);

    res.json({
      allowed: rateLimitResult.allowed,
      remaining: rateLimitResult.remaining,
      resetAt: rateLimitResult.resetAt,
      retryAfter: rateLimitResult.retryAfter,
    });
  } catch (error: any) {
    console.error('[openai-route] Error checking rate limit:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to check rate limit',
    });
  }
});

/**
 * POST /api/reset-rate-limit
 *
 * Reset rate limit for a user (admin only)
 *
 * Request body:
 *   - userId: User ID to reset (optional, defaults to current user)
 *
 * Response:
 *   - success: boolean
 */
router.post('/reset-rate-limit', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.id || (req as any).userId;
    if (!currentUserId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required',
      });
      return;
    }

    // Allow users to reset their own rate limit or admins to reset any
    const targetUserId = req.body.userId || currentUserId;
    const isAdmin = (req as any).user?.role === 'admin' || (req as any).user?.isAdmin;

    if (targetUserId !== currentUserId && !isAdmin) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can reset rate limits for other users',
      });
      return;
    }

    const queue = await getOpenAIQueue();
    await queue.resetRateLimit(targetUserId);

    res.json({
      success: true,
      message: `Rate limit reset for user ${targetUserId}`,
    });
  } catch (error: any) {
    console.error('[openai-route] Error resetting rate limit:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to reset rate limit',
    });
  }
});

module.exports = router;
