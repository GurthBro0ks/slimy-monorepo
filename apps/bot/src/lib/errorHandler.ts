/**
 * Centralized error handling utilities
 * Provides crash safety for event handlers and other async operations
 */

import { logError, type LogContext } from './logger.js';
import type { Interaction } from 'discord.js';

/**
 * Wraps an async function with error handling
 * Logs errors with context and prevents crashes
 */
export function safeHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  context: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      const logContext: LogContext = { context };

      // Extract Discord-specific context if available
      const firstArg = args[0];
      if (firstArg) {
        // Check for interaction
        if ('guildId' in firstArg && 'user' in firstArg) {
          const interaction = firstArg as Interaction;
          logContext.guildId = interaction.guildId || 'DM';
          logContext.userId = interaction.user?.id;
          logContext.channelId = interaction.channelId || undefined;
        }
        // Check for message
        else if ('guild' in firstArg && 'author' in firstArg) {
          const message = firstArg as any;
          logContext.guildId = message.guild?.id || 'DM';
          logContext.userId = message.author?.id;
          logContext.channelId = message.channel?.id;
        }
        // Check for generic client events with guild
        else if ('id' in firstArg && 'name' in firstArg) {
          const guild = firstArg as any;
          logContext.guildId = guild.id;
        }
      }

      logError(
        `Unhandled error in ${context}`,
        error instanceof Error ? error : new Error(String(error)),
        logContext
      );
    }
  }) as T;
}

/**
 * Wraps a synchronous function with error handling
 * Logs errors with context and prevents crashes
 */
export function safeSyncHandler<T extends (...args: any[]) => any>(
  handler: T,
  context: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      return handler(...args);
    } catch (error) {
      logError(
        `Unhandled error in ${context}`,
        error instanceof Error ? error : new Error(String(error)),
        { context }
      );
    }
  }) as T;
}
