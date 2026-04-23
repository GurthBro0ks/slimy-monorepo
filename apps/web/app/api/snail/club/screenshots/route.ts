import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getOpenAIClient } from "@/lib/openai-client";
import { insertImportLog } from "@/lib/club/import-log";

export const runtime = "nodejs";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";
const GEMINI_MODEL = "gemini-2.5-flash-preview-05-20";
const OPENAI_MODEL = "gpt-4o";

const GUILD_ID = process.env.DEFAULT_GUILD_ID || "1176605506912141444";

const SYSTEM_PROMPT = `You are a precise Super Snail game data extractor. Your job is to read Manage Members screenshots and extract member rows with exact power numbers.

IMPORTANT — Character disambiguation:
The game font makes certain characters very hard to distinguish. Be especially careful with short names (1-4 characters):
- Lowercase "l" (L) vs uppercase "I" (i) vs digit "1": these look nearly identical. Prefer "l" (lowercase L) for names.
- Uppercase "O" vs digit "0": prefer the letter "O" for names.
- If a name could be read multiple ways, choose the reading that looks most like a player name (e.g., "lil" not "ill" or "1i1").
Examine each character of short names extra carefully before committing to a reading.

Output ONLY a JSON array. Each element must be an object with exactly these fields:
{
  "name": "string — the player's display name exactly as shown",
  "sim_power": integer — the Sim Power number with no commas or formatting,
  "total_power": integer — the Total Power number with no commas or formatting, or 0 if not visible
}

Rules:
- SKIP any row where the power number is cut off or not fully visible.
- SKIP header rows, footer rows, and any non-member rows.
- power must be an integer with no commas.
- Do NOT include any text outside the JSON array.`;

interface ExtractedMember {
  name: string;
  sim_power: number;
  total_power: number;
}

interface OcrResult {
  members: ExtractedMember[];
  imageIndex: number;
  provider: string;
  error?: string;
}

function stripCodeFence(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
  }
  return cleaned.trim();
}

function parseMemberJson(raw: string): ExtractedMember[] {
  const cleaned = stripCodeFence(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        parsed = JSON.parse(arrayMatch[0]);
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const members: ExtractedMember[] = [];
  for (const obj of parsed as Array<Record<string, unknown>>) {
    const name = typeof obj.name === "string" ? obj.name.trim() : "";
    if (!name) continue;

    const rawSimPower = obj.sim_power ?? obj.simPower ?? obj.power ?? 0;
    const rawTotalPower = obj.total_power ?? obj.totalPower ?? 0;

    let simPower: number;
    if (typeof rawSimPower === "number") {
      simPower = Math.floor(rawSimPower);
    } else if (typeof rawSimPower === "string") {
      simPower = parseInt(rawSimPower.replace(/[^0-9]/g, ""), 10) || 0;
    } else {
      simPower = 0;
    }

    let totalPower: number;
    if (typeof rawTotalPower === "number") {
      totalPower = Math.floor(rawTotalPower);
    } else if (typeof rawTotalPower === "string") {
      totalPower = parseInt(rawTotalPower.replace(/[^0-9]/g, ""), 10) || 0;
    } else {
      totalPower = 0;
    }

    members.push({ name, sim_power: simPower, total_power: totalPower });
  }

  return members;
}

async function tryGeminiOCR(
  base64Data: string,
  mimeType: string
): Promise<ExtractedMember[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const response = await fetch(`${GEMINI_BASE_URL}chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all visible member rows from this Super Snail Manage Members screenshot. Return the JSON array.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Gemini");
  }

  return parseMemberJson(content);
}

async function tryOpenAIOCR(
  base64Data: string,
  mimeType: string
): Promise<ExtractedMember[]> {
  const openai = getOpenAIClient();

  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0,
    max_tokens: 4000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all visible member rows from this Super Snail Manage Members screenshot. Return the JSON array.",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: "high" },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  return parseMemberJson(content);
}

async function ocrImage(
  base64Data: string,
  mimeType: string,
  imageIndex: number
): Promise<OcrResult> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const members = await tryGeminiOCR(base64Data, mimeType);
      console.info(
        `[screenshots OCR] Image ${imageIndex}: Gemini ${GEMINI_MODEL} succeeded (${members.length} members)`
      );
      return { members, imageIndex, provider: `Gemini ${GEMINI_MODEL}` };
    } catch (geminiErr) {
      console.warn(
        `[screenshots OCR] Image ${imageIndex}: Gemini failed: ${
          geminiErr instanceof Error ? geminiErr.message : geminiErr
        } — falling back to OpenAI`
      );
    }
  } else {
    console.info(
      "[screenshots OCR] GEMINI_API_KEY not set, using OpenAI directly"
    );
  }

  try {
    const members = await tryOpenAIOCR(base64Data, mimeType);
    const providerLabel = geminiKey
      ? `GPT-4o (Gemini fallback)`
      : `GPT-4o`;
    console.info(
      `[screenshots OCR] Image ${imageIndex}: ${providerLabel} succeeded (${members.length} members)`
    );
    return { members, imageIndex, provider: providerLabel };
  } catch (openaiErr) {
    console.error(
      `[screenshots OCR] Image ${imageIndex}: Both providers failed. OpenAI error:`,
      openaiErr
    );
    return {
      members: [],
      imageIndex,
      provider: "none",
      error: openaiErr instanceof Error ? openaiErr.message : "Unknown OCR error",
    };
  }
}

export async function POST(request: NextRequest) {
  let ownerEmail = "unknown";
  let ownerRole = "unknown";
  try {
    try {
      const ownerCtx = await requireOwner(request);
      ownerEmail = ownerCtx.owner.email;
      ownerRole = ownerCtx.owner.role;
    } catch (authError: unknown) {
      if (authError instanceof NextResponse) return authError;
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "multipart/form-data required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const files: File[] = [];

    for (const [, value] of formData.entries()) {
      if (value instanceof File) {
        const ext = value.name.toLowerCase();
        if (
          ext.endsWith(".png") ||
          ext.endsWith(".jpg") ||
          ext.endsWith(".jpeg") ||
          ext.endsWith(".webp")
        ) {
          files.push(value);
        }
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No valid images provided. Accept: png, jpg, jpeg, webp" },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images per batch" },
        { status: 400 }
      );
    }

    const results: OcrResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type || "image/png";

      const result = await ocrImage(base64, mimeType, i);
      results.push(result);
    }

    const allMembers: ExtractedMember[] = [];
    const errors: string[] = [];
    const providers: string[] = [];

    for (const result of results) {
      if (result.error) {
        errors.push(`Image ${result.imageIndex + 1}: ${result.error}`);
      }
      providers.push(`Image ${result.imageIndex + 1}: ${result.provider}`);
      allMembers.push(...result.members);
    }

    const deduped = deduplicateMembers(allMembers);

    const uniqueProviderSet = new Set(providers.map((p) => p.split(": ").pop() || p));
    const providerSummary = Array.from(uniqueProviderSet).join(", ");

    await insertImportLog({
      guild_id: GUILD_ID,
      action_type: "screenshot_scan",
      user_email: ownerEmail,
      user_role: ownerRole,
      member_count: deduped.length,
      members_json: JSON.stringify(deduped.map((m) => m.name)),
      provider: providerSummary,
      source_info: `${files.length} screenshots processed`,
      errors_json: JSON.stringify(errors),
    });

    return NextResponse.json({
      members: deduped,
      totalExtracted: allMembers.length,
      duplicatesRemoved: allMembers.length - deduped.length,
      imagesProcessed: files.length,
      providers,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[/api/snail/club/screenshots] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function deduplicateMembers(members: ExtractedMember[]): ExtractedMember[] {
  const seen = new Map<string, ExtractedMember>();

  for (const m of members) {
    const key = m.name.toLowerCase().replace(/\s+/g, "");
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, m);
    } else {
      if (
        m.sim_power > existing.sim_power ||
        m.total_power > existing.total_power
      ) {
        seen.set(key, m);
      }
    }
  }

  return Array.from(seen.values());
}
