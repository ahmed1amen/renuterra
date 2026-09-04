import { env } from "@/env";

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

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Thin fetch wrapper for the external API. Throws ApiError on non-2xx so
 * TanStack Query treats failures as errors rather than resolved data.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const base = env.NEXT_PUBLIC_API_URL ?? "";

  const response = await fetch(`${base}${path}`, {
    ...rest,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      `${rest.method ?? "GET"} ${path} failed`,
      response.status,
      payload,
    );
  }

  return payload as T;
}
