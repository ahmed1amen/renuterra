"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { commentsApi } from "./api";
import type { CommentPatch, NewComment, PageComment } from "./types";

export const commentKeys = {
  all: ["page-comments"] as const,
  list: (page: string) => ["page-comments", page] as const,
};

/** True when Supabase env vars are present. Static for the whole session. */
export function commentsEnabled(): boolean {
  return getSupabase() !== null;
}

export function useComments(page: string) {
  return useQuery({
    queryKey: commentKeys.list(page),
    queryFn: () => commentsApi.list(page),
    enabled: commentsEnabled(),
  });
}

function useInvalidate(page: string) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: commentKeys.list(page) });
  }, [queryClient, page]);
}

export function useAddComment(page: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate(page);

  return useMutation({
    mutationFn: (input: NewComment) => commentsApi.add(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.list(page) });
      const previous = queryClient.getQueryData<PageComment[]>(
        commentKeys.list(page),
      );
      const optimistic: PageComment = {
        id: `optimistic-${crypto.randomUUID()}`,
        page: input.page,
        x: input.x,
        y: input.y,
        author: input.author,
        body: input.body,
        image: input.image ?? null,
        resolved: false,
        parentId: input.parentId ?? null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<PageComment[]>(
        commentKeys.list(page),
        (old = []) => [...old, optimistic],
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentKeys.list(page), context.previous);
      }
    },
    onSettled: invalidate,
  });
}

export function useUpdateComment(page: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate(page);

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CommentPatch }) =>
      commentsApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.list(page) });
      const previous = queryClient.getQueryData<PageComment[]>(
        commentKeys.list(page),
      );
      queryClient.setQueryData<PageComment[]>(
        commentKeys.list(page),
        (old = []) => old.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentKeys.list(page), context.previous);
      }
    },
    onSettled: invalidate,
  });
}

export function useDeleteComment(page: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate(page);

  return useMutation({
    mutationFn: (id: string) => commentsApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.list(page) });
      const previous = queryClient.getQueryData<PageComment[]>(
        commentKeys.list(page),
      );
      queryClient.setQueryData<PageComment[]>(
        commentKeys.list(page),
        (old = []) => old.filter((c) => c.id !== id && c.parentId !== id),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentKeys.list(page), context.previous);
      }
    },
    onSettled: invalidate,
  });
}

/**
 * Live updates: any change to the page's comments (from any reviewer)
 * invalidates the query so every open tab converges.
 */
export function useRealtimeComments(page: string) {
  const invalidate = useInvalidate(page);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel(`page-comments-${page}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "page_comments",
          filter: `page=eq.${page}`,
        },
        invalidate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, invalidate]);
}
