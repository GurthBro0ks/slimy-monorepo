import { NextRequest, NextResponse } from "next/server";
import { normalizeError, logApiError } from "./errors";

type RouteContext = {
  params?: Record<string, string> | Promise<Record<string, string>> | Promise<{}>;
};

type HandlerResult =
  | NextResponse
  | {
      data?: unknown;
      body?: unknown;
      status?: number;
      headers?: HeadersInit;
    };

function toResponseShape(result?: Exclude<HandlerResult, NextResponse>) {
  const status = result?.status ?? 200;
  const headers = result?.headers;

  if (result && typeof result === "object" && "body" in result && result.body !== undefined) {
    return { status, headers, body: result.body };
  }

  return {
    status,
    headers,
    body: {
      ok: true,
      data: result?.data,
      status,
    },
  };
}

export type ApiRouteHandler = (
  request: NextRequest,
  context?: RouteContext
) => Promise<HandlerResult>;

export function apiHandler(handler: ApiRouteHandler): ApiRouteHandler {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      const result = await handler(request, context);

      if (result instanceof NextResponse) {
        return result;
      }

      const { body, status, headers } = toResponseShape(result);
      return NextResponse.json(body, { status, headers });
    } catch (error) {
      const apiError = normalizeError(error);
      logApiError(apiError, { path: request.url, method: request.method });

      return NextResponse.json(apiError.toJSON(), {
        status: apiError.status,
        headers: { "x-error-code": apiError.code },
      });
    }
  };
}
