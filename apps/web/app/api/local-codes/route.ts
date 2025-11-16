import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const revalidate = 60;

interface Code {
  code: string;
  source: string;
  ts: string;
  tags?: string[];
  expires?: string | null;
  region?: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "active";

  try {
    const filePath = join(process.cwd(), "data/codes/sample.json");
    const fileContent = readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    let codes: Code[] = data.codes || [];

    // Filter by scope
    if (scope === "active") {
      const now = new Date();
      codes = codes.filter((code) => {
        if (!code.expires) return true;
        return new Date(code.expires) > now;
      });
    } else if (scope === "past7") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      codes = codes.filter((code) => new Date(code.ts) > weekAgo);
    }

    return NextResponse.json({ codes });
  } catch (error) {
    console.error("Local codes error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "FILE_ERROR",
        message: "Failed to read local codes",
      },
      { status: 500 }
    );
  }
}
