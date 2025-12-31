"use client";

const API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE ?? "";

/**
 * SSR / test / node-safe EventSource accessor
 */
const getEventSource = () => {
  if (typeof window === "undefined") return null;
  return globalThis.EventSource ?? null;
};

function safeParse(data) {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

export async function runTaskStream({
  guildId,
  taskName,
  body = {},
  csrfToken,
  onEvent,
}) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (csrfToken) headers.set("x-csrf-token", csrfToken);

  const response = await fetch(
    `${API_BASE}/api/guilds/${guildId}/tasks/${taskName}`,
    {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const message = `Failed to start task (${response.status})`;
    throw new Error(message);
  }

  const { taskId } = await response.json();
  if (!taskId) {
    throw new Error("Task did not return a taskId");
  }

  if (onEvent) {
    onEvent({ event: "start", data: { taskId } });
  }

  return subscribeTask(taskId, { onEvent });
}

export function subscribeTask(taskId, { onEvent } = {}) {
  return new Promise((resolve) => {
    const ES = getEventSource();
    if (!ES) {
      // SSR or unsupported environment - resolve immediately
      console.warn("EventSource not available in this environment");
      resolve({ status: "unavailable" });
      return;
    }

    let settled = false;
    const source = new ES(
      `${API_BASE}/api/tasks/${taskId}/stream`,
      { withCredentials: true },
    );

    const cleanup = () => {
      source.close();
    };

    source.addEventListener("log", (event) => {
      const payload = safeParse(event.data);
      if (onEvent) onEvent({ event: "log", data: payload });
    });

    source.addEventListener("error", (event) => {
      const payload = safeParse(event.data);
      if (payload && onEvent) {
        onEvent({ event: "error", data: payload });
      }
      if (source.readyState === ES.CLOSED) {
        cleanup();
        resolve({ status: "closed" });
      }
    });

    source.addEventListener("end", (event) => {
      const payload = safeParse(event.data);
      if (onEvent) onEvent({ event: "end", data: payload });
      cleanup();
      if (!settled) {
        settled = true;
        resolve(payload);
      }
    });

    source.onerror = () => {
      if (source.readyState === ES.CLOSED) {
        cleanup();
        if (!settled) {
          settled = true;
          resolve({ status: "closed" });
        }
      }
    };
  });
}
