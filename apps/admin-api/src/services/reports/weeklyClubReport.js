/**
 * Weekly Club Report Generator
 *
 * Generates comprehensive weekly reports for clubs including:
 * - Summary statistics
 * - Top performers
 * - Discord-friendly embeds
 * - HTML output for web display
 */

"use strict";

const { query } = require('../../../lib/database.js');

/**
 * Build a weekly club report for the specified guild
 *
 * @param {string} guildId - The guild ID to generate report for
 * @param {Object} options - Optional configuration
 * @param {Date} options.weekStart - Week start date (defaults to current week Monday)
 * @returns {Promise<Object>} Complete weekly report with summary, embeds, and HTML
 */
async function buildWeeklyClubReport(guildId, options = {}) {
  // Calculate week boundaries
  const weekStart = options.weekStart || getWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  // TODO: Once weekly deltas are implemented, integrate them here
  // TODO: Once tiers system is implemented, fetch tier data
  // TODO: Once seasons system is implemented, include season context

  // Fetch analytics data for the week
  const analyticsData = await fetchWeeklyAnalytics(guildId, weekStart, weekEnd);

  // Check if we have sufficient data
  if (!analyticsData || analyticsData.analyses.length === 0) {
    return buildNoDataReport(guildId, weekStart, weekEnd);
  }

  // Build summary statistics
  const summary = buildSummary(analyticsData);

  // Generate Discord embeds
  const discordEmbeds = buildDiscordEmbeds(guildId, weekStart, weekEnd, summary, analyticsData);

  // Generate HTML output
  const html = buildHTML(guildId, weekStart, weekEnd, summary, analyticsData);

  return {
    guildId,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    summary,
    raw: analyticsData,
    discordEmbeds,
    html,
  };
}

/**
 * Get the start of the current week (Monday 00:00:00)
 */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the week (Sunday 23:59:59)
 */
function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Fetch analytics data for the specified week
 */
async function fetchWeeklyAnalytics(guildId, weekStart, weekEnd) {
  try {
    // Fetch all analyses for this guild in the date range
    const analyses = await query(
      `SELECT
        ca.id,
        ca.guildId,
        ca.userId,
        ca.title,
        ca.summary,
        ca.confidence,
        ca.createdAt,
        COUNT(DISTINCT cm.id) as metricCount
      FROM ClubAnalysis ca
      LEFT JOIN ClubMetric cm ON cm.analysisId = ca.id
      WHERE ca.guildId = ?
        AND ca.createdAt >= ?
        AND ca.createdAt <= ?
      GROUP BY ca.id
      ORDER BY ca.createdAt DESC`,
      [guildId, weekStart, weekEnd]
    );

    // Fetch metrics for these analyses
    const metrics = await query(
      `SELECT
        cm.analysisId,
        cm.name,
        cm.value,
        cm.unit,
        cm.category
      FROM ClubMetric cm
      INNER JOIN ClubAnalysis ca ON ca.id = cm.analysisId
      WHERE ca.guildId = ?
        AND ca.createdAt >= ?
        AND ca.createdAt <= ?
      ORDER BY cm.analysisId, cm.category, cm.name`,
      [guildId, weekStart, weekEnd]
    );

    // TODO: Fetch weekly deltas when available
    // const deltas = await query(`SELECT * FROM WeeklyDeltas WHERE guildId = ? AND weekStart = ?`, [guildId, weekStart]);

    // TODO: Fetch tier information when available
    // const tiers = await query(`SELECT * FROM MemberTiers WHERE guildId = ? AND date BETWEEN ? AND ?`, [guildId, weekStart, weekEnd]);

    // TODO: Fetch season context when available
    // const season = await one(`SELECT * FROM Seasons WHERE guildId = ? AND startDate <= ? AND endDate >= ?`, [guildId, weekStart, weekEnd]);

    return {
      analyses,
      metrics,
      // Future: deltas, tiers, season
    };
  } catch (error) {
    console.error('Error fetching weekly analytics:', error);
    throw error;
  }
}

/**
 * Build summary statistics from analytics data
 */
function buildSummary(analyticsData) {
  const { analyses, metrics } = analyticsData;

  // TODO: Replace with actual member data when weekly deltas are available
  // For now, use unique user IDs from analyses as proxy
  const uniqueUsers = new Set(analyses.map(a => a.userId).filter(Boolean));
  const totalMembers = uniqueUsers.size;

  // Calculate average confidence from analyses
  const avgConfidence = analyses.length > 0
    ? analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length
    : 0;

  // TODO: Calculate actual power deltas when weekly delta system is implemented
  // For now, generate mock data based on metrics
  const mockPowerDeltas = generateMockPowerDeltas(analyses, metrics);
  const avgPowerDelta = mockPowerDeltas.length > 0
    ? mockPowerDeltas.reduce((sum, d) => sum + d.powerDelta, 0) / mockPowerDeltas.length
    : 0;

  // Top gainers (sorted by power delta)
  const topGainers = mockPowerDeltas
    .sort((a, b) => b.powerDelta - a.powerDelta)
    .slice(0, 5);

  // TODO: Replace with actual tier system when implemented
  // For now, assign mock tiers based on analysis count/quality
  const topTierMembers = generateMockTiers(analyses)
    .filter(t => ['Tier I', 'Tier II'].includes(t.tier))
    .slice(0, 5);

  return {
    totalMembers,
    avgPowerDelta,
    topGainers,
    topTierMembers,
    totalAnalyses: analyses.length,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
  };
}

/**
 * Generate mock power deltas until weekly delta system is implemented
 * TODO: Remove this when WeeklyDeltas table/service is available
 */
function generateMockPowerDeltas(analyses, metrics) {
  const userMetrics = new Map();

  analyses.forEach(analysis => {
    if (analysis.userId) {
      const userKey = `user_${analysis.userId}`;
      const relatedMetrics = metrics.filter(m => m.analysisId === analysis.id);

      // Sum numeric metric values as proxy for "power"
      const powerValue = relatedMetrics.reduce((sum, m) => {
        const numValue = parseFloat(m.value);
        return sum + (isNaN(numValue) ? 0 : numValue);
      }, 0);

      userMetrics.set(userKey, (userMetrics.get(userKey) || 0) + powerValue);
    }
  });

  return Array.from(userMetrics.entries()).map(([memberKey, powerDelta]) => ({
    memberKey,
    powerDelta: Math.round(powerDelta),
  }));
}

/**
 * Generate mock tier assignments until tier system is implemented
 * TODO: Remove this when Tiers table/service is available
 */
function generateMockTiers(analyses) {
  const userAnalysisCount = new Map();

  analyses.forEach(analysis => {
    if (analysis.userId) {
      const userKey = `user_${analysis.userId}`;
      userAnalysisCount.set(userKey, (userAnalysisCount.get(userKey) || 0) + 1);
    }
  });

  return Array.from(userAnalysisCount.entries()).map(([memberKey, count]) => {
    let tier = 'Tier IV';
    if (count >= 10) tier = 'Tier I';
    else if (count >= 7) tier = 'Tier II';
    else if (count >= 4) tier = 'Tier III';

    return { memberKey, tier };
  });
}

/**
 * Build Discord embeds for posting to channels
 */
function buildDiscordEmbeds(guildId, weekStart, weekEnd, summary, analyticsData) {
  const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // TODO: Add theming support - color from guild settings
  // TODO: Add localization support - language from guild settings

  const embeds = [
    {
      title: '📊 Weekly Club Report',
      description: `Report for ${dateFormat.format(weekStart)} - ${dateFormat.format(weekEnd)}`,
      color: 0x5865F2, // Discord blurple
      fields: [
        {
          name: '👥 Total Members',
          value: summary.totalMembers.toString(),
          inline: true,
        },
        {
          name: '📈 Avg Power Delta',
          value: `${summary.avgPowerDelta >= 0 ? '+' : ''}${Math.round(summary.avgPowerDelta)}`,
          inline: true,
        },
        {
          name: '📊 Total Analyses',
          value: summary.totalAnalyses.toString(),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    },
  ];

  // Top Gainers embed
  if (summary.topGainers.length > 0) {
    embeds.push({
      title: '🏆 Top Gainers',
      description: 'Members with highest power increase this week',
      color: 0x57F287, // Green
      fields: summary.topGainers.map((gainer, idx) => ({
        name: `${idx + 1}. ${gainer.memberKey}`,
        value: `+${Math.round(gainer.powerDelta)} power`,
        inline: false,
      })),
    });
  }

  // Top Tier Members embed
  if (summary.topTierMembers.length > 0) {
    embeds.push({
      title: '⭐ Top Tier Members',
      description: 'Elite performers in Tier I & II',
      color: 0xFEE75C, // Yellow
      fields: summary.topTierMembers.map((member, idx) => ({
        name: `${idx + 1}. ${member.memberKey}`,
        value: member.tier,
        inline: true,
      })),
    });
  }

  return embeds;
}

/**
 * Build HTML output for web display
 */
function buildHTML(guildId, weekStart, weekEnd, summary, analyticsData) {
  const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // TODO: Add theming support - use guild's color scheme
  // TODO: Add localization support - translate strings based on guild settings
  // TODO: Consider using a proper templating engine (Handlebars, EJS) for more complex reports

  return `
    <div class="weekly-report">
      <h1>📊 Weekly Club Report</h1>
      <p class="date-range">${dateFormat.format(weekStart)} - ${dateFormat.format(weekEnd)}</p>

      <div class="summary-stats">
        <h2>Summary</h2>
        <ul>
          <li><strong>Total Members:</strong> ${summary.totalMembers}</li>
          <li><strong>Average Power Delta:</strong> ${summary.avgPowerDelta >= 0 ? '+' : ''}${Math.round(summary.avgPowerDelta)}</li>
          <li><strong>Total Analyses:</strong> ${summary.totalAnalyses}</li>
          <li><strong>Average Confidence:</strong> ${(summary.avgConfidence * 100).toFixed(1)}%</li>
        </ul>
      </div>

      ${summary.topGainers.length > 0 ? `
        <div class="top-gainers">
          <h2>🏆 Top Gainers</h2>
          <ol>
            ${summary.topGainers.map(gainer => `
              <li>${gainer.memberKey}: <strong>+${Math.round(gainer.powerDelta)}</strong> power</li>
            `).join('')}
          </ol>
        </div>
      ` : ''}

      ${summary.topTierMembers.length > 0 ? `
        <div class="top-tier-members">
          <h2>⭐ Top Tier Members</h2>
          <ul>
            ${summary.topTierMembers.map(member => `
              <li>${member.memberKey}: <strong>${member.tier}</strong></li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="footer">
        <p><em>Generated on ${new Date().toLocaleString()}</em></p>
      </div>
    </div>

    <style>
      .weekly-report {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .weekly-report h1 {
        color: #5865F2;
        border-bottom: 2px solid #5865F2;
        padding-bottom: 10px;
      }
      .date-range {
        color: #666;
        font-size: 0.9em;
        margin-top: -10px;
      }
      .summary-stats ul {
        list-style: none;
        padding: 0;
      }
      .summary-stats li {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      .top-gainers ol, .top-tier-members ul {
        line-height: 1.8;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        text-align: center;
        color: #999;
      }
    </style>
  `.trim();
}

/**
 * Build a "no data" report when insufficient analytics exist
 */
function buildNoDataReport(guildId, weekStart, weekEnd) {
  const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    guildId,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    summary: {
      totalMembers: 0,
      avgPowerDelta: 0,
      topGainers: [],
      topTierMembers: [],
      totalAnalyses: 0,
      avgConfidence: 0,
    },
    raw: { analyses: [], metrics: [] },
    discordEmbeds: [
      {
        title: '📊 Weekly Club Report',
        description: `No data available for ${dateFormat.format(weekStart)} - ${dateFormat.format(weekEnd)}`,
        color: 0x747F8D, // Gray
        fields: [
          {
            name: 'ℹ️ Info',
            value: 'No club analyses were recorded during this week. Try analyzing some screenshots to generate data!',
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
    html: `
      <div class="weekly-report no-data">
        <h1>📊 Weekly Club Report</h1>
        <p class="date-range">${dateFormat.format(weekStart)} - ${dateFormat.format(weekEnd)}</p>

        <div class="no-data-message">
          <p>⚠️ No data available for this week.</p>
          <p>No club analyses were recorded during this period. Try analyzing some screenshots to generate data!</p>
        </div>
      </div>

      <style>
        .weekly-report {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .weekly-report h1 {
          color: #5865F2;
          border-bottom: 2px solid #5865F2;
          padding-bottom: 10px;
        }
        .date-range {
          color: #666;
          font-size: 0.9em;
          margin-top: -10px;
        }
        .no-data-message {
          background: #f8f9fa;
          border-left: 4px solid #ffc107;
          padding: 20px;
          margin: 20px 0;
        }
        .no-data-message p {
          margin: 10px 0;
        }
      </style>
    `.trim(),
  };
}

module.exports = {
  buildWeeklyClubReport,
};
