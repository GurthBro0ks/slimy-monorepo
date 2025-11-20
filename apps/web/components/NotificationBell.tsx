"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true", {
        credentials: "include",
      });

      if (!response.ok) {
        // User not logged in or error - don't show bell
        setUnreadCount(0);
        return;
      }

      const data = await response.json();
      if (data.ok && data.notifications) {
        setUnreadCount(data.notifications.length);
      }
    } catch (err) {
      console.error("Error fetching notification count:", err);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  return (
    <Link
      href="/notifications"
      className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
      title="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-neon-green text-[10px] font-bold text-black">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
