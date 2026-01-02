"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "../lib/session";
import { getSocket, getSocketStatusSnapshot, subscribeSocketStatus } from "../lib/socket";
import { debugError, debugLog, debugWarn } from "../lib/slimy-debug";

export default function SlimeChatBar({ guildId }) {
  const { user } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [localError, setLocalError] = useState(null);
  const [socketStatus, setSocketStatus] = useState(() => getSocketStatusSnapshot());
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mountedRef = useRef(true);

  const isAdmin = user?.role === "admin";
  const roleLabel = isAdmin ? "(admin)" : "";

  // Room-scoped cache key
  const roomKey = isAdmin ? "admin-global" : `guild-${guildId || "unknown"}`;
  const cacheKey = `slimeChatCache:${roomKey}`;

  // Load cached messages on mount
  useEffect(() => {
    if (!user) return;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cachedMessages = JSON.parse(cached);
        if (Array.isArray(cachedMessages)) {
          setMessages(cachedMessages);
          debugLog("[chat-bar] loaded", cachedMessages.length, "cached messages for", roomKey);
        }
      }
    } catch (err) {
      debugWarn("[chat-bar] failed to load cache:", err);
    }
  }, [user, cacheKey, roomKey]);

  useEffect(() => subscribeSocketStatus(setSocketStatus), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Socket connection effect
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    const socketUrl = socket?.io?.uri || socket?.io?._uri || "same-origin";
    debugLog("[chat-bar] connecting to", socketUrl);

    socketRef.current = socket;

    const handleConnect = () => {
      debugLog("[chat-bar] connected");
      setLocalError(null);
    };

    const handleDisconnect = (reason) => {
      debugLog("[chat-bar] disconnected:", reason);
    };

    const handleError = (err) => {
      debugError("[chat-bar] socket error:", err);
    };

    const handleMessage = (message) => {
      if (!message || typeof message !== "object") return;
      // Filter messages: admins see all, non-admins see only non-admin messages
      if (message.adminOnly && !isAdmin) {
        return;
      }
      setMessages((prev) => {
        const updated = [...prev, message];
        // Cache last 50 messages
        try {
          const last50 = updated.slice(-50);
          localStorage.setItem(cacheKey, JSON.stringify(last50));
        } catch (err) {
          debugWarn("[chat-bar] failed to cache messages:", err);
        }
        return updated;
      });
    };

    const handleConnectError = (err) => {
      debugError("[chat-bar] connect_error:", err?.message);
    };

    if (!socket) return;
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("error", handleError);
    socket.on("chat:message", handleMessage);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("error", handleError);
      socket.off("chat:message", handleMessage);
      socket.off("connect_error", handleConnectError);
    };
  }, [user, isAdmin, cacheKey]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim() || !socketRef.current || !guildId) return;

    const message = {
      text: input.trim(),
      guildId,
      adminOnly: false, // Could add UI toggle for this
    };

    socketRef.current.emit("chat:message", message, (response) => {
      if (!mountedRef.current) return;
      if (response?.error) {
        setLocalError(response.error);
      }
    });

    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  const showNotConfigured =
    socketStatus.state === "idle" && !socketStatus.socketCreated && !socketStatus.attemptedAt;
  const connectionLabel = showNotConfigured
    ? "Not configured"
    : socketStatus.state === "connected"
      ? "Connected"
      : socketStatus.state === "connecting"
        ? "Connecting..."
        : socketStatus.state === "disabled"
          ? "Disabled"
          : socketStatus.state === "disconnected"
            ? "Disconnected"
            : socketStatus.state === "error"
              ? "Error"
              : "Idle";
  const connectionColor = showNotConfigured
    ? "#9ca3af"
    : socketStatus.state === "connected"
      ? "#34d399"
      : socketStatus.state === "connecting"
        ? "#fbbf24"
        : socketStatus.state === "error" || socketStatus.state === "disconnected"
          ? "#ef4444"
          : "#9ca3af";

  const socketErrorText =
    socketStatus.state === "error"
      ? socketStatus.lastError || "Connection error"
      : socketStatus.state === "disconnected"
        ? socketStatus.disconnectReason || "Disconnected"
        : null;

  const disableInput = socketStatus.state === "connecting";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#1f2937",
        borderTop: "1px solid #374151",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header Strip (always visible) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          cursor: "pointer",
          backgroundColor: "#111827",
          borderBottom: isOpen ? "1px solid #374151" : "none",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#f3f4f6", fontWeight: "600" }}>Chat</span>
          {roleLabel && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                backgroundColor: "#374151",
                padding: "0.125rem 0.5rem",
                borderRadius: "0.25rem",
              }}
            >
              {roleLabel}
            </span>
          )}
          <span style={{ fontSize: "0.75rem", color: connectionColor }}>
            {connectionLabel}
          </span>
          {(localError || socketErrorText) && (
            <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>
              {localError || socketErrorText}
            </span>
          )}
        </div>
        <span style={{ color: "#9ca3af" }}>
          {isOpen ? "▼" : "▲"}
        </span>
      </div>

      {/* Expanded Panel */}
      {isOpen && (
        <div
          style={{
            height: "40vh",
            maxHeight: "400px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#1f2937",
          }}
        >
          {/* Messages List */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              fontSize: "0.8rem",
              lineHeight: "1.2",
            }}
          >
            {messages.length === 0 && !(localError || socketErrorText) && socketStatus.state !== "connecting" && (
              <div style={{ color: "#9ca3af", textAlign: "center", marginTop: "2rem", fontSize: "0.75rem" }}>
                No messages yet. Start chatting!
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={msg.messageId || idx}
                style={{
                  padding: "4px 6px",
                  backgroundColor: msg.adminOnly ? "#374151" : "transparent",
                  borderLeft: `2px solid ${msg?.from?.color || "#9ca3af"}`,
                  borderRadius: "2px",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "2px" }}>
                  <span style={{ color: msg?.from?.color || "#9ca3af", fontWeight: "600", fontSize: "0.75rem" }}>
                    {msg?.from?.name || "User"}
                  </span>
                  <span style={{ color: "#6b7280", fontSize: "0.65rem" }}>
                    {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.adminOnly && (
                    <span style={{ color: "#ef4444", fontSize: "0.65rem", fontWeight: "600" }}>
                      [ADMIN]
                    </span>
                  )}
                </div>
                <div style={{ color: "#f3f4f6", fontSize: "0.8rem", whiteSpace: "pre-wrap", lineHeight: "1.3" }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          {!(localError || socketErrorText) && (
            <div
              style={{
                padding: "0.5rem 0.75rem",
                borderTop: "1px solid #374151",
                display: "flex",
                gap: "0.4rem",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={guildId ? "Type a message..." : "Select a guild first"}
                disabled={!guildId || disableInput}
                style={{
                  flex: 1,
                  padding: "0.4rem 0.6rem",
                  backgroundColor: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "0.25rem",
                  color: "#f3f4f6",
                  fontSize: "0.8rem",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !guildId || disableInput}
                style={{
                  padding: "0.4rem 0.8rem",
                  backgroundColor: input.trim() && guildId && !disableInput ? "#3b82f6" : "#4b5563",
                  color: "#f3f4f6",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: input.trim() && guildId && !disableInput ? "pointer" : "not-allowed",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                }}
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
