import { db as prisma } from "@/lib/db";

export type NotificationType =
  | "farming_quality"
  | "streak_break"
  | "bot_error"
  | "sync_fail"
  | "custom";

export type NotificationSeverity = "info" | "warn" | "error";

interface CreateNotificationInput {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message: string;
}

/**
 * Create a notification. Safe to call from anywhere — wraps in try-catch
 * so notification failures never break the calling code.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.slimyNotification.create({
      data: {
        type: input.type,
        severity: input.severity || "info",
        title: input.title,
        message: input.message,
      },
    });
  } catch (err) {
    console.error("[notifications] Failed to create notification:", err);
    return null;
  }
}

/**
 * Get unread notification count.
 */
export async function getUnreadCount() {
  try {
    return await prisma.slimyNotification.count({
      where: { read: false, dismissed: false },
    });
  } catch {
    return 0;
  }
}
