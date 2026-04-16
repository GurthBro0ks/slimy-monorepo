/**
 * LLM provider fallback — tries OpenAI → Gemini → Anthropic.
 * Ported from /opt/slimy/app/lib/llm-fallback.js
 */

import { openai } from "./openai.js";

const DEFAULT_TIMEOUT_MS = 45000;
const _TRANSIENT_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function getFetch() {
  if (typeof globalThis.fetch === "function") return globalThis.fetch;
  // Use dynamic import as fallback
  return null;
}

async function fetchJson(
  url: string,
  options: Record<string, unknown>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchFn = getFetch();
    if (!fetchFn) throw new Error("No fetch available");

    const response = await fetchFn(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!response.ok) {
      const message =
        (data as { error?: { message?: string } })?.error?.message ||
        (data as { message?: string })?.message ||
        `HTTP ${response.status}`;
      const err = new Error(message) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function extractSystem(
  messages: Array<{ role: string; content: unknown }>,
): {
  system: string | undefined;
  messages: Array<{ role: string; content: unknown }>;
} {
  const systemParts: string[] = [];
  const rest: Array<{ role: string; content: unknown }> = [];

  for (const message of messages) {
    if (message.role === "system") {
      if (typeof message.content === "string") {
        systemParts.push(message.content);
      }
    } else {
      rest.push(message);
    }
  }

  return {
    system: systemParts.join("\n").trim() || undefined,
    messages: rest,
  };
}

async function callOpenAI(payload: {
  model?: string;
  messages: Array<{ role: string; content: unknown }>;
  temperature?: number;
  max_tokens?: number;
  timeoutMs?: number;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = payload.model || process.env.OPENAI_MODEL || "gpt-4o";
  const params = {
    model,
    messages: payload.messages,
    temperature: payload.temperature ?? 0.8,
    max_tokens: payload.max_tokens || 1000,
  };

  try {
    // Try the openai client first
    const result = await openai.chat.completions.create({
      model: params.model,
      messages: params.messages as Array<{ role: string; content: string }>,
      max_tokens: params.max_tokens,
      temperature: params.temperature,
    });

    const text =
      (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]
        ?.message?.content || "No response.";
    return { text, model };
  } catch (err) {
    // Fallback to direct API
    const data = await fetchJson(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(params),
      },
      payload.timeoutMs || DEFAULT_TIMEOUT_MS,
    );

    const d = data as { choices?: Array<{ message?: { content?: string } }> };
    return {
      text: d.choices?.[0]?.message?.content || "No response.",
      model,
    };
  }
}

async function callGemini(payload: {
  geminiModel?: string;
  messages: Array<{ role: string; content: unknown }>;
  temperature?: number;
  max_tokens?: number;
  timeoutMs?: number;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const { system, messages } = extractSystem(payload.messages);
  const model =
    payload.geminiModel || process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : message.role,
    parts: [{ text: String(message.content) }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: payload.temperature ?? 0.8,
      maxOutputTokens: payload.max_tokens || 1000,
    },
  };

  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  const data = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    },
    payload.timeoutMs || DEFAULT_TIMEOUT_MS,
  );

  const d = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const parts = d.candidates?.[0]?.content?.parts || [];
  const textParts = parts
    .map((p) => p.text || "")
    .filter(Boolean);
  return { text: textParts.join("\n") || "No response.", model };
}

async function callAnthropic(payload: {
  anthropicModel?: string;
  messages: Array<{ role: string; content: unknown }>;
  temperature?: number;
  max_tokens?: number;
  timeoutMs?: number;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const { system, messages } = extractSystem(payload.messages);
  const model =
    payload.anthropicModel ||
    process.env.ANTHROPIC_MODEL ||
    "claude-sonnet-4-5";

  const body: Record<string, unknown> = {
    model,
    max_tokens: payload.max_tokens || 1000,
    temperature: payload.temperature ?? 0.8,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  if (system) body.system = system;

  const data = await fetchJson(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    },
    payload.timeoutMs || DEFAULT_TIMEOUT_MS,
  );

  const d = data as { content?: Array<{ text?: string }> };
  const content = d.content || [];
  const textParts = content
    .map((p) => p.text || "")
    .filter(Boolean);
  return { text: textParts.join("\n") || "No response.", model };
}

function hasConfiguredProvider(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY ||
      openai.isConfigured(),
  );
}

interface CallResult {
  response: string;
  providerUsed: string;
}

async function callWithFallback(payload: {
  model?: string;
  messages: Array<{ role: string; content: unknown }>;
  temperature?: number;
  max_tokens?: number;
}): Promise<CallResult> {
  const providers = [
    {
      name: "openai",
      isConfigured: () => Boolean(process.env.OPENAI_API_KEY || process.env.AI_API_KEY),
      call: callOpenAI,
    },
    {
      name: "gemini",
      isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
      call: callGemini,
    },
    {
      name: "anthropic",
      isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),
      call: callAnthropic,
    },
  ];

  if (!providers.some((p) => p.isConfigured())) {
    const err = new Error("No LLM providers configured");
    (err as Error & { code?: string }).code = "no_providers_configured";
    throw err;
  }

  for (const provider of providers) {
    if (!provider.isConfigured()) continue;

    try {
      const result = await provider.call({
        model: payload.model,
        messages: payload.messages,
        temperature: payload.temperature,
        max_tokens: payload.max_tokens,
      });
      return { response: result.text, providerUsed: provider.name };
    } catch (_err) {
      // Try next provider
      continue;
    }
  }

  throw new Error("All LLM providers failed");
}

export { callWithFallback, hasConfiguredProvider };

