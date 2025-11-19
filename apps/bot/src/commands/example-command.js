"use strict";

const { createLogger, isDebug, logDebug, redactSecrets } = require("../../lib/logger");

/**
 * Example command handler demonstrating safe debug logging
 * This is a template for how bot commands should use debug mode
 */
async function handleExampleCommand(interaction) {
  const startTime = Date.now();
  const logger = createLogger({
    interactionId: interaction.id,
    command: interaction.commandName,
  });

  // Debug: Log full interaction payload shape (with secrets redacted)
  if (isDebug()) {
    logDebug(logger, {
      interactionType: interaction.type,
      commandName: interaction.commandName,
      userId: interaction.user?.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      options: interaction.options?.data || [],
      locale: interaction.locale,
      memberPermissions: interaction.memberPermissions,
    }, "[DEBUG] Received command interaction");
  }

  logger.info({
    userId: interaction.user?.id,
    guildId: interaction.guildId,
  }, "Processing example command");

  try {
    // Simulate command logic
    const result = await processCommand(interaction);

    const duration = Date.now() - startTime;

    // Debug: Log command processing details
    if (isDebug()) {
      logDebug(logger, {
        duration,
        resultSize: JSON.stringify(result).length,
        hasEmbeds: !!result.embeds,
        hasComponents: !!result.components,
        timing: {
          total: duration,
          perSecond: duration > 0 ? (1000 / duration).toFixed(2) : "N/A",
        },
      }, "[DEBUG] Command processed successfully");
    }

    logger.info({ duration }, "Command completed successfully");

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error({
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
      duration,
    }, "Command failed");

    // Debug: Log additional error context
    if (isDebug()) {
      logDebug(logger, {
        errorType: error.constructor.name,
        duration,
        interactionData: redactSecrets({
          commandName: interaction.commandName,
          options: interaction.options?.data || [],
        }),
      }, "[DEBUG] Command failure details");
    }

    throw error;
  }
}

/**
 * Example command processing function
 */
async function processCommand(interaction) {
  const logger = createLogger({ command: "example" });

  // Debug: Log API call details (if any)
  if (isDebug()) {
    logDebug(logger, {
      action: "fetchData",
      userId: interaction.user?.id,
    }, "[DEBUG] Fetching data for command");
  }

  // Simulate some async work
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    content: "Command executed successfully!",
    embeds: [],
    components: [],
  };
}

module.exports = {
  handleExampleCommand,
};
