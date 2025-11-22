import { describe, it, expect } from "vitest";
import { apiHandler } from "./handler";
import { ValidationApiError } from "./errors";

const mockRequest = (url = "http://localhost/api"): any => ({
  method: "GET",
  url,
});

describe("apiHandler", () => {
  it("wraps successful responses with ok=true payload", async () => {
    const handler = apiHandler(async () => ({ data: { hello: "world" } }));

    const response = await handler(mockRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data).toEqual({ hello: "world" });
  });

  it("serializes thrown errors into the standardized shape", async () => {
    const handler = apiHandler(async () => {
      throw new ValidationApiError("missing guild id");
    });

    const response = await handler(mockRequest("http://localhost/api?guildId="));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.message).toBe("missing guild id");
  });
});
