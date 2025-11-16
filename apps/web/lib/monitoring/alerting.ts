/**
 * Alerting System
 *
 * Provides alerting for critical application events and threshold breaches
 */

import { getLogger } from './logger';
import type { JSONObject } from '../types/common';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: number;
  metadata?: JSONObject;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * Alert channel interface
 */
export interface AlertChannel {
  name: string;
  send(alert: Alert): Promise<void>;
}

/**
 * Console alert channel (for development)
 */
class ConsoleAlertChannel implements AlertChannel {
  name = 'console';

  async send(alert: Alert): Promise<void> {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };

    console.log(
      `${emoji[alert.severity]} [ALERT] ${alert.title}`,
      '\nMessage:', alert.message,
      '\nSeverity:', alert.severity,
      '\nMetadata:', alert.metadata
    );
  }
}

/**
 * Webhook alert channel
 */
class WebhookAlertChannel implements AlertChannel {
  name = 'webhook';
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async send(alert: Alert): Promise<void> {
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }
}

/**
 * Email alert channel (placeholder)
 */
class EmailAlertChannel implements AlertChannel {
  name = 'email';
  private recipients: string[];

  constructor(recipients: string[]) {
    this.recipients = recipients;
  }

  async send(alert: Alert): Promise<void> {
    // TODO: Implement email sending
    console.log(`Would send email alert to: ${this.recipients.join(', ')}`);
  }
}

/**
 * Alerting Manager
 */
export class AlertingManager {
  private channels: AlertChannel[];
  private alerts: Alert[];
  private maxStoredAlerts: number = 1000;
  private logger = getLogger({ component: 'Alerting' });

  constructor() {
    this.channels = [];
    this.alerts = [];

    // Add default console channel in development
    if (process.env.NODE_ENV !== 'production') {
      this.addChannel(new ConsoleAlertChannel());
    }

    // Add webhook channel if configured
    if (process.env.ALERT_WEBHOOK_URL) {
      this.addChannel(new WebhookAlertChannel(process.env.ALERT_WEBHOOK_URL));
    }

    // Add email channel if configured
    if (process.env.ALERT_EMAIL_RECIPIENTS) {
      const recipients = process.env.ALERT_EMAIL_RECIPIENTS.split(',');
      this.addChannel(new EmailAlertChannel(recipients));
    }
  }

  /**
   * Add an alert channel
   */
  addChannel(channel: AlertChannel): void {
    this.channels.push(channel);
    this.logger.info(`Added alert channel: ${channel.name}`);
  }

  /**
   * Send an alert
   */
  async sendAlert(
    title: string,
    message: string,
    severity: AlertSeverity,
    metadata?: JSONObject
  ): Promise<Alert> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      title,
      message,
      severity,
      timestamp: Date.now(),
      metadata,
      resolved: false,
    };

    // Store alert
    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxStoredAlerts) {
      this.alerts.shift();
    }

    // Log alert
    if (severity === 'critical' || severity === 'error') {
      this.logger.error(`Alert: ${title}`, undefined, metadata);
    } else if (severity === 'warning') {
      this.logger.warn(`Alert: ${title}`, metadata);
    } else {
      this.logger.info(`Alert: ${title}`, metadata);
    }

    // Send to all channels
    await Promise.all(
      this.channels.map((channel) =>
        channel.send(alert).catch((error) => {
          this.logger.error(`Failed to send alert via ${channel.name}`, error as Error);
        })
      )
    );

    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): Alert | null {
    const alert = this.alerts.find((a) => a.id === alertId);

    if (!alert) {
      return null;
    }

    alert.resolved = true;
    alert.resolvedAt = Date.now();

    this.logger.info(`Alert resolved: ${alert.title}`, { alertId });

    return alert;
  }

  /**
   * Get all alerts
   */
  getAlerts(filters?: {
    severity?: AlertSeverity;
    resolved?: boolean;
    since?: number;
  }): Alert[] {
    let filtered = this.alerts;

    if (filters?.severity) {
      filtered = filtered.filter((a) => a.severity === filters.severity);
    }

    if (filters?.resolved !== undefined) {
      filtered = filtered.filter((a) => a.resolved === filters.resolved);
    }

    const since = filters?.since;
    if (typeof since === 'number') {
      filtered = filtered.filter((a) => a.timestamp >= since);
    }

    return filtered;
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(): Alert[] {
    return this.getAlerts({ resolved: false });
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.logger.info('All alerts cleared');
  }
}

// Singleton instance
let alertingManagerInstance: AlertingManager | null = null;

/**
 * Get alerting manager instance
 */
export function getAlertingManager(): AlertingManager {
  if (!alertingManagerInstance) {
    alertingManagerInstance = new AlertingManager();
  }
  return alertingManagerInstance;
}

/**
 * Pre-configured alert helpers
 */
export const Alerts = {
  /**
   * Send high error rate alert
   */
  async highErrorRate(errorRate: number, threshold: number): Promise<Alert> {
    const manager = getAlertingManager();
    return await manager.sendAlert(
      'High Error Rate Detected',
      `Error rate is ${errorRate.toFixed(2)}%, exceeding threshold of ${threshold}%`,
      'critical',
      { errorRate, threshold }
    );
  },

  /**
   * Send slow response time alert
   */
  async slowResponseTime(avgResponseTime: number, threshold: number): Promise<Alert> {
    const manager = getAlertingManager();
    return await manager.sendAlert(
      'Slow Response Time Detected',
      `Average response time is ${avgResponseTime.toFixed(0)}ms, exceeding threshold of ${threshold}ms`,
      'warning',
      { avgResponseTime, threshold }
    );
  },

  /**
   * Send database connection error alert
   */
  async databaseConnectionError(error: Error): Promise<Alert> {
    const manager = getAlertingManager();
    return await manager.sendAlert(
      'Database Connection Error',
      `Failed to connect to database: ${error.message}`,
      'critical',
      { error: error.message, stack: error.stack ?? null }
    );
  },

  /**
   * Send external service error alert
   */
  async externalServiceError(service: string, error: Error): Promise<Alert> {
    const manager = getAlertingManager();
    return await manager.sendAlert(
      `External Service Error: ${service}`,
      `Failed to communicate with ${service}: ${error.message}`,
      'error',
      { service, error: error.message }
    );
  },

  /**
   * Send high memory usage alert
   */
  async highMemoryUsage(usage: number, threshold: number): Promise<Alert> {
    const manager = getAlertingManager();
    return await manager.sendAlert(
      'High Memory Usage',
      `Memory usage is ${usage.toFixed(1)}%, exceeding threshold of ${threshold}%`,
      'warning',
      { usage, threshold }
    );
  },

  /**
   * Send disk space low alert
   */
  async diskSpaceLow(available: number, total: number): Promise<Alert> {
    const manager = getAlertingManager();
    const percentAvailable = (available / total) * 100;
    return await manager.sendAlert(
      'Disk Space Low',
      `Only ${percentAvailable.toFixed(1)}% disk space remaining`,
      'warning',
      { available, total, percentAvailable }
    );
  },

  /**
   * Send security threat detected alert
   */
  async securityThreat(threat: string, details: JSONObject): Promise<Alert> {
    const manager = getAlertingManager();
    return await manager.sendAlert(
      `Security Threat Detected: ${threat}`,
      `Potential security threat detected`,
      'critical',
      { threat, ...details }
    );
  },
};
