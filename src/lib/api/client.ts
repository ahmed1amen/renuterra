/**
 * HTTP client for the external API.
 *
 * Uses fetch rather than axios so Server Components, Route Handlers and the
 * browser all share one implementation.
 */
import { env } from "@/env";
import { ApiError } from "./errors";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const base = env.NEXT_PUBLIC_API_URL ?? "";

  const response = await fetch(`${base}${path}`, {
    ...rest,
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(`${method} ${path} failed`, response.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(path: string, options?: RequestOptions) =>
    request<T>("POST", path, options),
  put: <T>(path: string, options?: RequestOptions) =>
    request<T>("PUT", path, options),
  patch: <T>(path: string, options?: RequestOptions) =>
    request<T>("PATCH", path, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
