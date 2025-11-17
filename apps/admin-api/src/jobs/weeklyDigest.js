"use strict";

const database = require("../lib/database");
const notifyService = require("../services/notifications/notifyService");
const dmService = require("../services/notifications/dmService");

/**
 * Generate weekly digest for all users who have opted in
 * This should be called by a cron job or worker once per week
 * @returns {Promise<Object>} Summary of the job execution
 */
async function runWeeklyDigestJob() {
  console.log("[weeklyDigest] Starting weekly digest job...");
  const startTime = Date.now();

  try {
    const prisma = database.getClient();

    // Get all users who have opted in for weekly digest
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        weeklyDigest: true,
      },
      include: {
        user: true,
      },
    });

    console.log(`[weeklyDigest] Found ${preferences.length} users opted in for weekly digest`);

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const pref of preferences) {
      try {
        const userId = pref.userId;
        const user = pref.user;

        // Get stats from the last week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Fetch user's club analyses from the last week
        const analyses = await prisma.clubAnalysis.findMany({
          where: {
            userId,
            createdAt: {
              gte: oneWeekAgo,
            },
          },
          include: {
            guild: true,
          },
        });

        // Fetch user's screenshot analyses from the last week
        const screenshots = await prisma.screenshotAnalysis.findMany({
          where: {
            userId,
            createdAt: {
              gte: oneWeekAgo,
            },
          },
        });

        // Compose digest summary
        const analysisCount = analyses.length;
        const screenshotCount = screenshots.length;

        // Skip if no activity
        if (analysisCount === 0 && screenshotCount === 0) {
          console.log(`[weeklyDigest] No activity for user ${userId}, skipping`);
          continue;
        }

        // Build digest message
        let digestBody = "Here's your weekly summary:\n\n";

        if (analysisCount > 0) {
          digestBody += `Club Analyses: ${analysisCount} new ${analysisCount === 1 ? "analysis" : "analyses"}\n`;
        }

        if (screenshotCount > 0) {
          digestBody += `Screenshots Analyzed: ${screenshotCount} ${screenshotCount === 1 ? "screenshot" : "screenshots"}\n`;
        }

        // TODO: Add more detailed stats:
        // - Top performing clubs
        // - Badges earned
        // - Leaderboard positions
        // - Insights and recommendations

        // Create notification
        await notifyService.createNotification({
          userId,
          type: "weekly_digest",
          title: "Your Weekly Slimy.ai Digest",
          body: digestBody,
          meta: {
            analysisCount,
            screenshotCount,
            weekStartDate: oneWeekAgo.toISOString(),
          },
        });

        // Send Discord DM if opted in
        if (pref.discordDMOptIn) {
          const shortMessage = `Your weekly digest is ready! You had ${analysisCount} club ${analysisCount === 1 ? "analysis" : "analyses"} and ${screenshotCount} ${screenshotCount === 1 ? "screenshot" : "screenshots"} analyzed this week.`;
          await dmService.sendDiscordDM(user.discordId, shortMessage);
        }

        successCount++;
      } catch (error) {
        console.error(`[weeklyDigest] Error processing user ${pref.userId}:`, error);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      totalUsers: preferences.length,
      successCount,
      errorCount,
      durationMs: duration,
    };

    console.log("[weeklyDigest] Job completed:", summary);
    return summary;
  } catch (error) {
    console.error("[weeklyDigest] Fatal error in weekly digest job:", error);
    throw error;
  }
}

module.exports = {
  runWeeklyDigestJob,
};
