import type { CommentThread, PageComment, ThreadFilter } from "./types";

const byCreatedAt = (a: PageComment, b: PageComment) =>
  a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

/**
 * Group a flat comment list into threads: top-level comments in chronological
 * order, each with its replies in chronological order. A reply whose parent is
 * missing (deleted mid-flight) is promoted to a root so it never disappears.
 */
export function groupThreads(comments: PageComment[]): CommentThread[] {
  const ids = new Set(comments.map((c) => c.id));
  const roots: PageComment[] = [];
  const repliesByParent = new Map<string, PageComment[]>();

  for (const comment of comments) {
    if (comment.parentId && ids.has(comment.parentId)) {
      const list = repliesByParent.get(comment.parentId) ?? [];
      list.push(comment);
      repliesByParent.set(comment.parentId, list);
    } else {
      roots.push(comment);
    }
  }

  return roots.sort(byCreatedAt).map((root) => ({
    root,
    replies: (repliesByParent.get(root.id) ?? []).sort(byCreatedAt),
  }));
}

export function filterThreads(
  threads: CommentThread[],
  filter: ThreadFilter,
): CommentThread[] {
  if (filter === "all") return threads;
  return threads.filter((t) => t.root.resolved === (filter === "resolved"));
}

/** Unresolved top-level comments — the number shown on badges. */
export function openThreadCount(comments: PageComment[]): number {
  return groupThreads(comments).filter((t) => !t.root.resolved).length;
}
