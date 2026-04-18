/**
 * AI Client supporting OpenAI, Z.AI GLM, and Ollama.
 * Ported from /opt/slimy/app/lib/openai.js
 */

const baseURL = process.env.AI_BASE_URL || "https://api.z.ai/api/paas/v4";
const apiKey = process.env.OPENAI_API_KEY;

const isConfigured = Boolean(apiKey);

if (!isConfigured) {
  console.warn("[openai] Missing OPENAI_API_KEY — AI features will refuse.");
}

async function makeRequest<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch(`${baseURL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AI API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

export const openai = {
  chat: {
    completions: {
      create: async (params: {
        model?: string;
        messages?: Array<{ role: string; content: unknown }>;
        max_tokens?: number;
        temperature?: number;
      }) => {
        return makeRequest<OpenAIResponse>("/chat/completions", {
          model: params.model || "glm-4.6v",
          messages: params.messages,
          max_tokens: params.max_tokens ?? 1000,
          temperature: params.temperature ?? 0,
        });
      },
    },
  },
  isConfigured: () => isConfigured,
};

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export default openai;
