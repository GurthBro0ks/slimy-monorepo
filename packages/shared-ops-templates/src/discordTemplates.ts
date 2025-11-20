/**
 * Discord Message Templates for Operations Automation
 *
 * This module provides strongly-typed template functions for Discord webhook messages.
 * Templates are pure string functions with no runtime side effects.
 *
 * @packageDocumentation
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface DeploymentSuccessData {
  service_name: string;
  environment: string;
  commit_sha: string;
  branch: string;
  deployer: string;
  hostname: string;
  timestamp: string;
  duration: string;
  commit_url?: string;
}

export interface DeploymentFailureData {
  service_name: string;
  environment: string;
  commit_sha: string;
  branch: string;
  deployer: string;
  hostname: string;
  timestamp: string;
  error_snippet: string;
  log_url?: string;
  rollback_available: 'yes' | 'no';
}

export interface DirtyRepoAlertData {
  hostname: string;
  service_name: string;
  environment: string;
  branch: string;
  commit_sha: string;
  uncommitted_files: string;
  untracked_files: string;
  ahead_behind?: string;
  timestamp: string;
  check_interval?: string;
}

export type IncidentSeverity = 'P0/Critical' | 'P1/High' | 'P2/Medium' | 'P3/Low';
export type IncidentStatus = 'DETECTED' | 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';

export interface IncidentData {
  incident_id: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  affected_services: string;
  impact: string;
  started_at: string;
  detected_at: string;
  resolved_at?: string;
  duration?: string;
  incident_commander: string;
  responders?: string;
  root_cause?: string;
  action_items: string;
  customer_impact?: string;
}

export interface WeeklySummaryData {
  week_start: string;
  week_end: string;
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  success_rate: number;
  total_incidents: number;
  incident_breakdown: string;
  total_downtime: number;
  most_deployed_service: string;
  deployment_list: string;
  incident_list: string;
  top_contributors: string;
  system_health: string;
  alerts_fired: number;
  alerts_resolved: number;
  notable_changes: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

// ============================================================================
// Color Constants
// ============================================================================

export const DISCORD_COLORS = {
  SUCCESS: 3066993,    // Green
  ERROR: 15158332,     // Red
  WARNING: 16776960,   // Yellow
  INFO: 3447003,       // Blue
} as const;

// ============================================================================
// Deployment Success Templates
// ============================================================================

/**
 * Generate a Discord webhook payload for a successful deployment
 */
export function deploymentSuccess(data: DeploymentSuccessData): DiscordWebhookPayload {
  return {
    username: 'Deploy Bot',
    embeds: [
      {
        title: '✅ Deployment Successful',
        description: `**${data.service_name}** deployed to **${data.environment}**`,
        color: DISCORD_COLORS.SUCCESS,
        fields: [
          {
            name: 'Commit',
            value: data.commit_url
              ? `[\`${data.commit_sha}\`](${data.commit_url})`
              : `\`${data.commit_sha}\``,
            inline: true,
          },
          {
            name: 'Branch',
            value: data.branch,
            inline: true,
          },
          {
            name: 'Deployer',
            value: data.deployer,
            inline: true,
          },
          {
            name: 'Hostname',
            value: data.hostname,
            inline: true,
          },
          {
            name: 'Duration',
            value: data.duration,
            inline: true,
          },
          {
            name: 'Time',
            value: data.timestamp,
            inline: true,
          },
        ],
        footer: {
          text: 'slimy-monorepo deployment system',
        },
        timestamp: data.timestamp,
      },
    ],
  };
}

/**
 * Generate a simple text-only deployment success message
 */
export function deploymentSuccessSimple(data: DeploymentSuccessData): DiscordWebhookPayload {
  return {
    content: `✅ **Deployment Success** | Service: \`${data.service_name}\` | Env: \`${data.environment}\` | Commit: \`${data.commit_sha}\` | Branch: \`${data.branch}\` | By: ${data.deployer}`,
  };
}

// ============================================================================
// Deployment Failure Templates
// ============================================================================

/**
 * Generate a Discord webhook payload for a failed deployment
 */
export function deploymentFailure(data: DeploymentFailureData): DiscordWebhookPayload {
  return {
    username: 'Deploy Bot',
    content: `@here ⚠️ Deployment failed for **${data.service_name}** in **${data.environment}**`,
    embeds: [
      {
        title: '❌ Deployment Failed',
        description: `**${data.service_name}** failed to deploy to **${data.environment}**`,
        color: DISCORD_COLORS.ERROR,
        fields: [
          {
            name: 'Commit',
            value: `\`${data.commit_sha}\``,
            inline: true,
          },
          {
            name: 'Branch',
            value: data.branch,
            inline: true,
          },
          {
            name: 'Deployer',
            value: data.deployer,
            inline: true,
          },
          {
            name: 'Hostname',
            value: data.hostname,
            inline: true,
          },
          {
            name: 'Rollback Available',
            value: data.rollback_available,
            inline: true,
          },
          {
            name: 'Time',
            value: data.timestamp,
            inline: true,
          },
          {
            name: 'Error',
            value: `\`\`\`\n${data.error_snippet}\n\`\`\``,
            inline: false,
          },
          ...(data.log_url
            ? [
                {
                  name: 'Logs',
                  value: `[View Full Logs](${data.log_url})`,
                  inline: false,
                },
              ]
            : []),
        ],
        footer: {
          text: 'slimy-monorepo deployment system',
        },
        timestamp: data.timestamp,
      },
    ],
  };
}

/**
 * Generate a simple text-only deployment failure message
 */
export function deploymentFailureSimple(data: DeploymentFailureData): DiscordWebhookPayload {
  const logInfo = data.log_url ? `\nLogs: ${data.log_url}` : '';
  return {
    content: `❌ **Deployment Failed** @here\nService: \`${data.service_name}\` | Env: \`${data.environment}\` | Commit: \`${data.commit_sha}\` | Branch: \`${data.branch}\`\nError: \`\`\`${data.error_snippet}\`\`\`${logInfo}`,
  };
}

// ============================================================================
// Dirty Repository Alert Templates
// ============================================================================

/**
 * Generate a Discord webhook payload for a dirty repository alert
 */
export function dirtyRepoAlert(data: DirtyRepoAlertData): DiscordWebhookPayload {
  return {
    username: 'Git Dirt Watch',
    content: '⚠️ Dirty repository detected on production host!',
    embeds: [
      {
        title: '🔧 Uncommitted Changes Detected',
        description: `Host **${data.hostname}** has uncommitted changes in **${data.service_name}**`,
        color: DISCORD_COLORS.WARNING,
        fields: [
          {
            name: 'Environment',
            value: data.environment,
            inline: true,
          },
          {
            name: 'Branch',
            value: data.branch,
            inline: true,
          },
          {
            name: 'Commit',
            value: `\`${data.commit_sha}\``,
            inline: true,
          },
          ...(data.ahead_behind
            ? [
                {
                  name: 'Sync Status',
                  value: data.ahead_behind,
                  inline: true,
                },
              ]
            : []),
          ...(data.check_interval
            ? [
                {
                  name: 'Check Interval',
                  value: data.check_interval,
                  inline: true,
                },
              ]
            : []),
          {
            name: 'Timestamp',
            value: data.timestamp,
            inline: true,
          },
          {
            name: 'Modified Files',
            value: `\`\`\`\n${data.uncommitted_files}\n\`\`\``,
            inline: false,
          },
          {
            name: 'Untracked Files',
            value: `\`\`\`\n${data.untracked_files}\n\`\`\``,
            inline: false,
          },
        ],
        footer: {
          text: 'Review and commit changes, or reset to clean state',
        },
        timestamp: data.timestamp,
      },
    ],
  };
}

/**
 * Generate a simple text-only dirty repo alert
 */
export function dirtyRepoAlertSimple(data: DirtyRepoAlertData): DiscordWebhookPayload {
  return {
    content: `⚠️ **Dirty Repo Alert**\nHost: \`${data.hostname}\` | Service: \`${data.service_name}\` | Env: \`${data.environment}\`\nModified: ${data.uncommitted_files}\nUntracked: ${data.untracked_files}`,
  };
}

// ============================================================================
// Incident Templates
// ============================================================================

/**
 * Get incident color based on severity
 */
function getIncidentColor(severity: IncidentSeverity): number {
  switch (severity) {
    case 'P0/Critical':
      return DISCORD_COLORS.ERROR;
    case 'P1/High':
      return 16744192; // Orange
    case 'P2/Medium':
      return DISCORD_COLORS.WARNING;
    case 'P3/Low':
      return DISCORD_COLORS.INFO;
    default:
      return DISCORD_COLORS.WARNING;
  }
}

/**
 * Generate a Discord webhook payload for a new incident
 */
export function incidentNew(data: IncidentData): DiscordWebhookPayload {
  return {
    username: 'Incident Bot',
    content: data.severity === 'P0/Critical' ? '@everyone 🚨 **CRITICAL INCIDENT DECLARED**' : undefined,
    embeds: [
      {
        title: `🚨 ${data.severity}: ${data.title}`,
        description: `**Incident ID:** ${data.incident_id}\n**Status:** ${data.status}`,
        color: getIncidentColor(data.severity),
        fields: [
          {
            name: 'Affected Services',
            value: data.affected_services,
            inline: false,
          },
          {
            name: 'Impact',
            value: data.impact,
            inline: false,
          },
          {
            name: 'Description',
            value: data.description,
            inline: false,
          },
          {
            name: 'Incident Commander',
            value: data.incident_commander,
            inline: true,
          },
          {
            name: 'Started At',
            value: data.started_at,
            inline: true,
          },
          {
            name: 'Detected At',
            value: data.detected_at,
            inline: true,
          },
          {
            name: 'Current Actions',
            value: data.action_items,
            inline: false,
          },
        ],
        footer: {
          text: `War room: #incident-${data.incident_id}`,
        },
        timestamp: data.detected_at,
      },
    ],
  };
}

/**
 * Generate a Discord webhook payload for an incident update
 */
export function incidentUpdate(data: IncidentData): DiscordWebhookPayload {
  return {
    username: 'Incident Bot',
    embeds: [
      {
        title: `📢 Incident Update: ${data.incident_id}`,
        description: `**${data.title}**\n**Status:** ${data.status}`,
        color: DISCORD_COLORS.WARNING,
        fields: [
          ...(data.root_cause
            ? [
                {
                  name: 'Root Cause',
                  value: data.root_cause,
                  inline: false,
                },
              ]
            : []),
          {
            name: 'Next Steps',
            value: data.action_items,
            inline: false,
          },
          ...(data.customer_impact
            ? [
                {
                  name: 'Customer Impact',
                  value: data.customer_impact,
                  inline: false,
                },
              ]
            : []),
        ],
        footer: {
          text: `Incident Commander: ${data.incident_commander}`,
        },
        timestamp: data.detected_at,
      },
    ],
  };
}

/**
 * Generate a Discord webhook payload for a resolved incident
 */
export function incidentResolved(data: IncidentData): DiscordWebhookPayload {
  return {
    username: 'Incident Bot',
    content: `✅ Incident ${data.incident_id} has been **RESOLVED**`,
    embeds: [
      {
        title: `✅ Incident Resolved: ${data.title}`,
        description: `**Incident ID:** ${data.incident_id}\n**Status:** RESOLVED`,
        color: DISCORD_COLORS.SUCCESS,
        fields: [
          {
            name: 'Severity',
            value: data.severity,
            inline: true,
          },
          ...(data.duration
            ? [
                {
                  name: 'Duration',
                  value: data.duration,
                  inline: true,
                },
              ]
            : []),
          {
            name: 'Started At',
            value: data.started_at,
            inline: true,
          },
          ...(data.resolved_at
            ? [
                {
                  name: 'Resolved At',
                  value: data.resolved_at,
                  inline: true,
                },
              ]
            : []),
          ...(data.root_cause
            ? [
                {
                  name: 'Root Cause',
                  value: data.root_cause,
                  inline: false,
                },
              ]
            : []),
          {
            name: 'Resolution',
            value: data.description,
            inline: false,
          },
          {
            name: 'Follow-up Actions',
            value: data.action_items,
            inline: false,
          },
        ],
        footer: {
          text: 'Post-mortem will be shared in #incidents',
        },
        timestamp: data.resolved_at || data.detected_at,
      },
    ],
  };
}

// ============================================================================
// Weekly Summary Templates
// ============================================================================

/**
 * Generate a Discord webhook payload for a weekly operations summary
 */
export function weeklySummary(data: WeeklySummaryData): DiscordWebhookPayload {
  return {
    username: 'Weekly Ops Report',
    embeds: [
      {
        title: '📊 Weekly Operations Summary',
        description: `**Week of ${data.week_start} - ${data.week_end}**`,
        color: DISCORD_COLORS.INFO,
        fields: [
          {
            name: '📦 Deployments',
            value: `**Total:** ${data.total_deployments}\n**Success:** ${data.successful_deployments} ✅\n**Failed:** ${data.failed_deployments} ❌\n**Success Rate:** ${data.success_rate}%`,
            inline: true,
          },
          {
            name: '🚨 Incidents',
            value: `**Total:** ${data.total_incidents}\n**Breakdown:** ${data.incident_breakdown}\n**Downtime:** ${data.total_downtime} min`,
            inline: true,
          },
          {
            name: '🔔 Alerts',
            value: `**Fired:** ${data.alerts_fired}\n**Resolved:** ${data.alerts_resolved}\n**Health:** ${data.system_health}`,
            inline: true,
          },
          {
            name: '🏆 Most Active Service',
            value: data.most_deployed_service,
            inline: true,
          },
          {
            name: '👥 Top Contributors',
            value: data.top_contributors,
            inline: true,
          },
          {
            name: 'Notable Deployments',
            value: data.deployment_list,
            inline: false,
          },
          {
            name: 'Incidents Summary',
            value: data.incident_list,
            inline: false,
          },
          {
            name: '✨ Notable Changes',
            value: data.notable_changes,
            inline: false,
          },
        ],
        footer: {
          text: 'slimy-monorepo weekly report • Generated automatically',
        },
        timestamp: `${data.week_end}T23:59:59Z`,
      },
    ],
  };
}

/**
 * Generate a compact weekly summary message
 */
export function weeklySummaryCompact(data: WeeklySummaryData): DiscordWebhookPayload {
  return {
    username: 'Weekly Ops Report',
    embeds: [
      {
        title: `📊 Week ${data.week_start} - ${data.week_end}`,
        color: DISCORD_COLORS.INFO,
        description: `**Deployments:** ${data.total_deployments} (${data.success_rate}% success)\n**Incidents:** ${data.total_incidents} (${data.total_downtime}m downtime)\n**Alerts:** ${data.alerts_fired} fired, ${data.alerts_resolved} resolved\n**Health:** ${data.system_health}`,
        fields: [
          {
            name: 'Top Deployments',
            value: data.deployment_list,
            inline: false,
          },
        ],
        timestamp: `${data.week_end}T23:59:59Z`,
      },
    ],
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a Discord webhook payload to a JSON string
 */
export function toJSON(payload: DiscordWebhookPayload): string {
  return JSON.stringify(payload, null, 2);
}

/**
 * Escape Discord markdown special characters in a string
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([*_`~|\\])/g, '\\$1');
}

/**
 * Truncate text to fit Discord field value limits (1024 characters)
 */
export function truncateFieldValue(text: string, maxLength: number = 1024): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}
