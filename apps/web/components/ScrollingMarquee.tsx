"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { usePathname } from "next/navigation";

interface ScrollingMarqueeProps {
  excludeOnPaths?: string[];
}

/**
 * ScrollingMarquee - Infinite horizontal scroll banner with dynamic data
 * Excludes rendering on specified paths (e.g., homepage)
 */
export default function ScrollingMarquee({ excludeOnPaths = ["/"] }: ScrollingMarqueeProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!user) {
      setContent("SYSTEM INITIALIZING... SLIMY.AI TERMINAL v2.1... AWAITING AUTHENTICATION...");
      return;
    }

    const username = user.name || "OPERATOR";
    const role = (user.role || "member").toUpperCase();
    const guildCount = user.guilds?.length || 0;

    const messages = [
      `WELCOME BACK, ${username}`,
      `ACCESS LEVEL: ${role}`,
      `GUILDS CONNECTED: ${guildCount}`,
      "SYSTEM STATUS: OPERATIONAL",
      "DATABASE: PRISMA CONNECTED",
      "WEBSOCKET: LIVE",
      "SLIME PROTOCOL: ENGAGED",
      "NEURAL LINK: STABLE",
      `SESSION ID: ${user.id?.slice(0, 8)}...`,
    ].filter(Boolean);

    setContent(messages.join(" ... "));
  }, [user]);

  // Don't render on excluded paths
  if (excludeOnPaths.includes(pathname || "")) {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "32px",
        backgroundColor: "rgba(13, 0, 26, 0.95)",
        borderBottom: "2px solid var(--neon-green)",
        overflow: "hidden",
        zIndex: 1050,
        boxShadow: "0 0 20px rgba(0, 255, 0, 0.3)",
      }}
    >
      <div
        className="marquee-content"
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          paddingLeft: "100%",
          animation: "marquee 30s linear infinite",
          fontFamily: "var(--font-pixel)",
          fontSize: "1.1rem",
          color: "var(--neon-green)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          lineHeight: "32px",
          textShadow: "0 0 10px rgba(0, 255, 0, 0.8)",
        }}
      >
        {content}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
