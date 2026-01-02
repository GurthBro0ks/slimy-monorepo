import { io } from "socket.io-client";

let socket = null;

const socketStatus = {
  state: "idle", // idle | connecting | connected | disconnected | error | disabled
  updatedAt: new Date().toISOString(),
  attemptedAt: null,
  connectedAt: null,
  disconnectedAt: null,
  disconnectReason: null,
  lastError: null,
};

const listeners = new Set();

function snapshot() {
  return {
    ...socketStatus,
    socketCreated: Boolean(socket),
    socketConnected: Boolean(socket?.connected),
    socketId: socket?.id || null,
  };
}

function emit() {
  const next = snapshot();
  for (const listener of listeners) {
    try {
      listener(next);
    } catch {
      // ignore listener errors
    }
  }
}

function setStatus(patch) {
  Object.assign(socketStatus, patch, { updatedAt: new Date().toISOString() });
  emit();
}

function resolveSocketBaseUrl() {
  if (typeof window === "undefined") return "";
  const override = String(process.env.NEXT_PUBLIC_ADMIN_SOCKET_URL || "").trim();
  if (override) return override;
  return window.location.origin;
}

function wireStatusEvents(sock) {
  if (!sock || sock.__slimyStatusWired) return;
  sock.__slimyStatusWired = true;

  sock.on("connect", () => {
    setStatus({
      state: "connected",
      connectedAt: new Date().toISOString(),
      disconnectedAt: null,
      disconnectReason: null,
      lastError: null,
    });
  });

  sock.on("disconnect", (reason) => {
    setStatus({
      state: "disconnected",
      disconnectedAt: new Date().toISOString(),
      disconnectReason: String(reason || ""),
    });
  });

  sock.on("connect_error", (err) => {
    setStatus({
      state: "error",
      lastError: err?.message || String(err || "connect_error"),
    });
  });

  sock.on("error", (err) => {
    setStatus({
      state: "error",
      lastError: err?.error || err?.message || String(err || "error"),
    });
  });
}

export function subscribeSocketStatus(listener) {
  listeners.add(listener);
  listener(snapshot());
  return () => listeners.delete(listener);
}

export function getSocketStatusSnapshot() {
  return snapshot();
}

export function getSocket(options = {}) {
  const enabled = options.enabled !== false;
  if (!enabled) {
    setStatus({ state: "disabled" });
    return null;
  }

  if (!socket) {
    const baseUrl = resolveSocketBaseUrl();
    setStatus({
      state: "connecting",
      attemptedAt: new Date().toISOString(),
      lastError: null,
    });
    socket = io(baseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    wireStatusEvents(socket);
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    setStatus({
      state: "disabled",
      disconnectedAt: new Date().toISOString(),
      disconnectReason: "manual_disconnect",
    });
  }
}
