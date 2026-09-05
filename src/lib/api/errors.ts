/**
 * API error types shared by the client and every consumer.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Narrow an unknown thrown value to a message safe to show a user. */
export function toErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
