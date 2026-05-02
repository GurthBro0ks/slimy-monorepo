import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/diag/route";

describe("/api/diag route", () => {
  it("returns ok status", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.status).toBe("ok");
    expect(payload.message).toBe("Web app is running.");
    expect(payload.timestamp).toBeDefined();
  });
});
