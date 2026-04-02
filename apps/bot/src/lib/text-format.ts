/**
 * Text formatting utilities for chat display.
 * Ported from /opt/slimy/app/lib/text-format.js
 */

function trimForDiscord(text: string, limit: number): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.slice(0, Math.max(0, limit - 1)) + "…";
}

function formatChatDisplay({
  userLabel,
  userMsg,
  persona,
  response,
}: {
  userLabel?: string;
  userMsg?: string;
  persona?: string;
  response?: string;
}): string {
  const personaName = persona || "slimy.ai";
  const safeUser = trimForDiscord(userMsg || "(no input)", 400);
  const userLine = `**${userLabel || "You"}:** ${safeUser}`;
  const prefix = `**${personaName}:** `;
  const available = Math.max(
    50,
    2000 - userLine.length - 2 - prefix.length,
  );
  const safeResponse = trimForDiscord(response || "(no content)", available);
  const botLine = `${prefix}${safeResponse}`;
  return `${userLine}\n\n${botLine}`;
}

export { trimForDiscord, formatChatDisplay };
