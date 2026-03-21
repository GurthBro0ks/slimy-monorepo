/**
 * club-ingest.js - Ingest OCR'd club screenshots into metrics storage
 * Bridges club-vision (OCR parsing) and club-store (persistence)
 */

const { classifyPage, parseManageMembersImageEnsemble } = require('./club-vision');
const { canonicalize, recordMetrics, recomputeLatest } = require('./club-store');
const logger = require('./logger');

/**
 * Ingest club metrics from OCR result
 * @param {object} params - Ingest parameters
 * @param {string} params.guildId - Guild ID
 * @param {string} params.pageType - Page type (e.g., 'manage_members')
 * @param {object} params.ocrResult - OCR result with text/rows
 * @param {Date} params.now - Observation timestamp (defaults to now)
 * @param {object} params.options - Parse options (e.g., medianHint)
 * @returns {Promise<object>} - Ingest result with stats
 */
async function ingestClubMetricsFromOcr({ guildId, pageType, ocrResult, now = new Date(), options = {} }) {
  const result = {
    guildId,
    pageType,
    membersProcessed: 0,
    metricsRecorded: 0,
    errors: []
  };

  try {
    // Classify page if not provided
    if (!pageType) {
      pageType = classifyPage(ocrResult);
      result.pageType = pageType;
    }

    // Only process manage_members pages for now
    if (pageType !== 'manage_members') {
      logger.info(`Skipping non-manage_members page: ${pageType}`, { guildId });
      return result;
    }

    // Parse OCR result
    const members = parseManageMembersImageEnsemble(ocrResult, options);
    result.membersProcessed = members.length;

    logger.info(`Parsed ${members.length} members from OCR`, { guildId, pageType });

    // Record metrics for each member
    for (const member of members) {
      try {
        const record = canonicalize(
          guildId,
          member.name,
          member.simPower,
          member.totalPower,
          now
        );

        await recordMetrics(record);
        result.metricsRecorded++;
      } catch (err) {
        const errMsg = `Failed to record metrics for ${member.name}: ${err.message}`;
        logger.warn(errMsg, { guildId, member: member.name });
        result.errors.push(errMsg);
      }
    }

    // Recompute latest aggregates
    await recomputeLatest(guildId);

    logger.info(`Ingested club metrics for ${result.metricsRecorded} members`, {
      guildId,
      membersProcessed: result.membersProcessed,
      metricsRecorded: result.metricsRecorded,
      errorCount: result.errors.length
    });

    return result;
  } catch (err) {
    const errMsg = `Failed to ingest club metrics: ${err.message}`;
    logger.error(errMsg, { guildId, error: err.stack });
    result.errors.push(errMsg);
    return result;
  }
}

/**
 * Rescan guild club metrics
 * Currently a stub that just recomputes latest aggregates
 * TODO: Integrate with full OCR pipeline when available
 *
 * @param {string} guildId - Guild ID
 * @param {object} options - Rescan options
 * @returns {Promise<object>} - Rescan result
 */
async function rescanGuildClubMetrics(guildId, options = {}) {
  try {
    logger.info('Rescanning guild club metrics', { guildId, options });

    // For now, just recompute latest from existing metrics
    await recomputeLatest(guildId);

    return {
      ok: true,
      guildId,
      message: 'Latest metrics recomputed. Full rescan pipeline TODO.',
      recomputedAt: new Date()
    };
  } catch (err) {
    logger.error('Failed to rescan guild club metrics', {
      guildId,
      error: err.message,
      stack: err.stack
    });

    throw err;
  }
}

module.exports = {
  ingestClubMetricsFromOcr,
  rescanGuildClubMetrics
};
