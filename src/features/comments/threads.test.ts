import { describe, expect, it } from "vitest";
import { filterThreads, groupThreads, openThreadCount } from "./threads";
import type { PageComment } from "./types";

function comment(overrides: Partial<PageComment>): PageComment {
  return {
    id: "id",
    page: "/dashboard",
    x: 50,
    y: 50,
    author: "Sara",
    body: "Body",
    resolved: false,
    parentId: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const root1 = comment({ id: "a", createdAt: "2026-01-01T10:00:00Z" });
const root2 = comment({
  id: "b",
  createdAt: "2026-01-01T09:00:00Z",
  resolved: true,
});
const replyLate = comment({
  id: "c",
  parentId: "a",
  createdAt: "2026-01-01T12:00:00Z",
});
const replyEarly = comment({
  id: "d",
  parentId: "a",
  createdAt: "2026-01-01T11:00:00Z",
});

describe("groupThreads", () => {
  it("groups replies under their root, both in chronological order", () => {
    const threads = groupThreads([replyLate, root1, replyEarly, root2]);
    expect(threads.map((t) => t.root.id)).toEqual(["b", "a"]);
    expect(threads[1].replies.map((r) => r.id)).toEqual(["d", "c"]);
  });

  it("promotes a reply with a missing parent to a root", () => {
    const orphan = comment({ id: "o", parentId: "gone" });
    const threads = groupThreads([orphan]);
    expect(threads).toHaveLength(1);
    expect(threads[0].root.id).toBe("o");
  });

  it("returns an empty list for no comments", () => {
    expect(groupThreads([])).toEqual([]);
  });
});

describe("filterThreads", () => {
  const threads = groupThreads([root1, root2, replyEarly]);

  it("filters by root resolution state", () => {
    expect(filterThreads(threads, "open").map((t) => t.root.id)).toEqual(["a"]);
    expect(filterThreads(threads, "resolved").map((t) => t.root.id)).toEqual([
      "b",
    ]);
    expect(filterThreads(threads, "all")).toHaveLength(2);
  });
});

describe("openThreadCount", () => {
  it("counts unresolved roots only — replies never count", () => {
    expect(openThreadCount([root1, root2, replyEarly, replyLate])).toBe(1);
  });
});
