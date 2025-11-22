import { AppError, isAppError } from "../errors";

export interface ApiErrorPayload {
  ok: false;
  code: string;
  message: string;
  status: number;
  hint?: string;
  details?: unknown;
  error?: string;
}

type ErrorLike = Partial<ApiErrorPayload> & {
  name?: string;
};

export class ApiError extends Error {
  code: string;
  status: number;
  hint?: string;
  details?: unknown;

  constructor(message: string, options: { code: string; status?: number; hint?: string; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status ?? 500;
    this.hint = options.hint;
    this.details = options.details;
  }

  toJSON(): ApiErrorPayload {
    return {
      ok: false,
      code: this.code,
      message: this.message,
      status: this.status,
      hint: this.hint,
      details: this.details,
      error: this.message, // Legacy field used by some callers
    };
  }
}

export class UpstreamError extends ApiError {
  constructor(status: number, message?: string, details?: unknown) {
    super(message ?? `Upstream request failed with status ${status}`, {
      code: "UPSTREAM_ERROR",
      status,
      details,
    });
    this.name = "UpstreamError";
  }
}

export class ValidationApiError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, {
      code: "VALIDATION_ERROR",
      status: 400,
      details,
    });
    this.name = "ValidationApiError";
  }
}

export class TimeoutApiError extends ApiError {
  constructor(message: string = "Request timed out", details?: unknown) {
    super(message, {
      code: "TIMEOUT_ERROR",
      status: 408,
      details,
    });
    this.name = "TimeoutApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function errorFromErrorLike(error: ErrorLike, fallbackStatus: number): ApiError {
  return new ApiError(error.message || "Request failed", {
    code: error.code || "API_ERROR",
    status: typeof error.status === "number" ? error.status : fallbackStatus,
    hint: error.hint,
    details: error.details ?? error,
  });
}

export function normalizeError(error: unknown, fallbackStatus: number = 500): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (isAppError(error)) {
    return new ApiError(error.message, {
      code: error.code,
      status: error.statusCode,
      details: error.details,
    });
  }

  if (error && typeof error === "object") {
    const maybeError = error as ErrorLike;
    if (maybeError.ok === false || maybeError.code || maybeError.status) {
      return errorFromErrorLike(maybeError, fallbackStatus);
    }
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new TimeoutApiError();
    }

    return new ApiError(error.message || "Network request failed", {
      code: "NETWORK_ERROR",
      status: fallbackStatus,
      details: { name: error.name, stack: error.stack },
    });
  }

  return new ApiError("An unknown error occurred", {
    code: "UNKNOWN_ERROR",
    status: fallbackStatus,
    details: error,
  });
}

export function serializeError(error: unknown, fallbackStatus: number = 500): ApiErrorPayload {
  return normalizeError(error, fallbackStatus).toJSON();
}

export function logApiError(error: ApiError, context?: Record<string, unknown>) {
  const payload = error.toJSON();
  console.error("[ApiError]", {
    ...payload,
    context,
    timestamp: new Date().toISOString(),
  });
}
