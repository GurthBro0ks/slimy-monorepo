"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Webhook Sender Service
 * Dispatches events to configured webhook endpoints with retry logic
 */

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

/**
 * Dispatch an event to all configured and enabled webhooks
 * @param {string} eventType - Type of event (e.g., "CLUB_SNAPSHOT_CREATED")
 * @param {object} payload - Event payload data
 * @param {string} [guildId] - Optional guild ID to filter webhooks
 * @returns {Promise<void>}
 */
async function dispatchEventToWebhooks(eventType, payload, guildId = null) {
  try {
    // Fetch all enabled webhooks that match the event type
    const webhooks = await prisma.webhook.findMany({
      where: {
        enabled: true,
        ...(guildId && { guildId }),
      },
    });

    // Filter webhooks that are subscribed to this event type
    const relevantWebhooks = webhooks.filter((webhook) => {
      const eventTypes = webhook.eventTypes.split(",").map((e) => e.trim());
      return eventTypes.includes(eventType);
    });

    if (relevantWebhooks.length === 0) {
      console.log(`No webhooks configured for event: ${eventType}`);
      return;
    }

    console.log(
      `Dispatching ${eventType} to ${relevantWebhooks.length} webhook(s)`
    );

    // Dispatch to all relevant webhooks in parallel (best-effort)
    const dispatchPromises = relevantWebhooks.map((webhook) =>
      sendWebhook(webhook, eventType, payload, guildId).catch((error) => {
        // Log error but don't throw - we want best-effort delivery
        console.error(
          `Failed to send webhook ${webhook.id} (${webhook.name}):`,
          error.message
        );
      })
    );

    await Promise.allSettled(dispatchPromises);
  } catch (error) {
    // Log error but don't throw - webhook failures should not break main flow
    console.error("Error dispatching webhooks:", error);
  }
}

/**
 * Send webhook to a specific endpoint with retry logic
 * @param {object} webhook - Webhook configuration
 * @param {string} eventType - Event type
 * @param {object} payload - Event payload
 * @param {string} guildId - Guild ID
 * @returns {Promise<void>}
 */
async function sendWebhook(webhook, eventType, payload, guildId) {
  const requestBody = {
    eventType,
    payload,
    guildId,
    timestamp: new Date().toISOString(),
  };

  // TODO: Add HMAC signature using webhook.secret
  // const signature = generateHmacSignature(webhook.secret, requestBody);
  // headers['X-Webhook-Signature'] = signature;

  let lastError = null;
  let responseCode = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

      const response = await fetch(webhook.targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Slimy.ai-Webhooks/1.0",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      responseCode = response.status;

      // Success if 2xx status code
      if (response.status >= 200 && response.status < 300) {
        await logDelivery(
          webhook.id,
          eventType,
          requestBody,
          "success",
          responseCode,
          null,
          retryCount
        );
        console.log(
          `Webhook ${webhook.id} (${webhook.name}) delivered successfully`
        );
        return;
      }

      // 4xx errors should not be retried (client error)
      if (response.status >= 400 && response.status < 500) {
        const errorText = await response.text().catch(() => "Unknown error");
        lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        break; // Don't retry on 4xx errors
      }

      // 5xx errors should be retried
      const errorText = await response.text().catch(() => "Unknown error");
      lastError = new Error(`HTTP ${response.status}: ${errorText}`);
      retryCount++;

      if (attempt < MAX_RETRIES) {
        console.log(
          `Webhook ${webhook.id} failed with ${response.status}, retrying in ${RETRY_DELAY}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    } catch (error) {
      lastError = error;
      retryCount++;

      // Network errors or timeouts - retry
      if (attempt < MAX_RETRIES) {
        console.log(
          `Webhook ${webhook.id} error: ${error.message}, retrying in ${RETRY_DELAY}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  // All retries exhausted - log as failed
  await logDelivery(
    webhook.id,
    eventType,
    requestBody,
    "failed",
    responseCode,
    lastError?.message || "Unknown error",
    retryCount
  );

  throw lastError;
}

/**
 * Log webhook delivery attempt to database
 * @param {number} webhookId - Webhook ID
 * @param {string} eventType - Event type
 * @param {object} payload - Payload sent
 * @param {string} status - Status ('success', 'failed', 'retrying')
 * @param {number} [responseCode] - HTTP response code
 * @param {string} [errorMessage] - Error message if failed
 * @param {number} [retryCount] - Number of retries attempted
 * @returns {Promise<void>}
 */
async function logDelivery(
  webhookId,
  eventType,
  payload,
  status,
  responseCode = null,
  errorMessage = null,
  retryCount = 0
) {
  try {
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        eventType,
        payload,
        status,
        responseCode,
        errorMessage:
          errorMessage && errorMessage.length > 500
            ? errorMessage.substring(0, 500)
            : errorMessage,
        retryCount,
      },
    });
  } catch (error) {
    // Don't throw - logging failure should not affect webhook delivery
    console.error("Failed to log webhook delivery:", error);
  }
}

/**
 * Validate webhook target URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
function isValidWebhookUrl(url) {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Only allow HTTP and HTTPS protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  dispatchEventToWebhooks,
  isValidWebhookUrl,
};
