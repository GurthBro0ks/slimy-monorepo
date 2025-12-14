import { io } from "socket.io-client";

let socket = null;

function resolveSocketBaseUrl() {
  if (typeof window === "undefined") return "";
  const override = String(process.env.NEXT_PUBLIC_ADMIN_SOCKET_URL || "").trim();
  if (override) return override;
  return window.location.origin;
}

export function getSocket() {
  if (!socket) {
    const baseUrl = resolveSocketBaseUrl();
    socket = io(baseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
