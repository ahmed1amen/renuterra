import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/errors";

/**
 * One client per browser session, one per server request — never shared.
 * Always construct through this factory so defaults stay consistent.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        // 4xx responses are the caller's fault; retrying only delays the error.
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status < 500) return false;
          return failureCount < 1;
        },
      },
    },
  });
}
