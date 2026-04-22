import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getOpenAIClient } from "@/lib/openai-client";

export const runtime = "nodejs";

const VISION_MODEL = "gpt-4o";

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

async function ocrImage(
  base64Data: string,
  mimeType: string,
  imageIndex: number
): Promise<OcrResult> {
  const openai = getOpenAIClient();

  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  try {
    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
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
      return { members: [], imageIndex, error: "Empty response from vision model" };
    }

    const members = parseMemberJson(content);
    return { members, imageIndex };
  } catch (err) {
    console.error(`[screenshots OCR] Image ${imageIndex} failed:`, err);
    return {
      members: [],
      imageIndex,
      error: err instanceof Error ? err.message : "Unknown OCR error",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    try {
      await requireOwner(request);
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

    for (const result of results) {
      if (result.error) {
        errors.push(`Image ${result.imageIndex + 1}: ${result.error}`);
      }
      allMembers.push(...result.members);
    }

    const deduped = deduplicateMembers(allMembers);

    return NextResponse.json({
      members: deduped,
      totalExtracted: allMembers.length,
      duplicatesRemoved: allMembers.length - deduped.length,
      imagesProcessed: files.length,
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
