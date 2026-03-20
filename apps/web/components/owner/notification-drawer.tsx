"use client";

import { useState, useEffect, useRef } from "react";

interface Notification {
  id: string;
  type: string;
  severity: "info" | "warn" | "error";
  title: string;
  message: string;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
}

function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fetch unread count (lightweight, runs on mount + every 30s always)
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/owner/notifications?unread=true&limit=1", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (err) {
      // Non-fatal
    }
  };

  // Fetch full notification list (when drawer opens)
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/notifications?unread=true&limit=20", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/owner/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/owner/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Dismiss notification (soft-delete via PATCH)
  const dismiss = async (id: string) => {
    try {
      const res = await fetch(`/api/owner/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dismissed: true }),
      });
      if (res.ok) {
        const wasUnread = notifications.find((n) => n.id === id && !n.read);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  // On mount: fetch unread count immediately + start 30s poll
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // When drawer opens, fetch full list
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      // Refresh list every 30s while open
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const bellBtn = document.getElementById("notification-bell");
      if (
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node) &&
        bellBtn &&
        !bellBtn.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const severityColors = {
    info: "border-blue-500/50 text-blue-300",
    warn: "border-yellow-500/50 text-yellow-300",
    error: "border-red-500/50 text-red-300",
  };

  const severityBadge = {
    info: "bg-blue-500/20 text-blue-400 text-xs",
    warn: "bg-yellow-500/20 text-yellow-400 text-xs",
    error: "bg-red-500/20 text-red-400 text-xs",
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {isOpen && (
        <div
          ref={drawerRef}
          className="absolute right-0 top-12 w-80 max-h-96 bg-[#0a0a0f] border border-purple-500/30 rounded-lg shadow-xl overflow-hidden z-[910]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-black/50">
            <h3 className="text-sm font-['VT323'] text-purple-300">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-gray-400 hover:text-purple-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-72">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm font-['VT323']">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm font-['VT323']">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-purple-500/10 ${severityColors[notification.severity]} ${
                    !notification.read ? "bg-purple-500/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded ${severityBadge[notification.severity]}`}>
                          {notification.severity.toUpperCase()}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm font-medium font-['VT323'] truncate">{notification.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1 font-['VT323']">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-['VT323']">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-['VT323']"
                        >
                          Read
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(notification.id)}
                        className="text-xs text-gray-500 hover:text-red-400 font-['VT323']"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}