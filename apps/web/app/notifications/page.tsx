"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  meta?: any;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const unreadOnly = filter === "unread";
      const response = await fetch(
        `/api/notifications?unreadOnly=${unreadOnly}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Please log in to view notifications");
          return;
        }
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      if (data.ok) {
        setNotifications(data.notifications);
      } else {
        throw new Error(data.message || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <Bell className="h-10 w-10 text-neon-green" />
            <h1 className="text-4xl font-bold">Notifications</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <Bell className="h-10 w-10 text-neon-green" />
            <h1 className="text-4xl font-bold">Notifications</h1>
          </div>
          <div className="rounded-lg border border-red-500 bg-red-500/10 p-4">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <Bell className="h-10 w-10 text-neon-green" />
          <div className="flex-1">
            <h1 className="text-4xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your latest activity
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "all"
                ? "bg-neon-green text-black font-semibold"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "unread"
                ? "bg-neon-green text-black font-semibold"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Unread
          </button>
        </div>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="text-center py-12 rounded-lg border border-gray-800 bg-gray-900/50">
            <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No notifications to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 transition-colors ${
                  notification.read
                    ? "border-gray-800 bg-gray-900/50"
                    : "border-neon-green/50 bg-neon-green/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-neon-green"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2 whitespace-pre-line">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDate(notification.createdAt)}</span>
                      <span>•</span>
                      <span className="capitalize">{notification.type.replace("_", " ")}</span>
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="px-3 py-1 text-sm rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
