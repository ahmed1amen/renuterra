"use client";

import { STORAGE_KEYS } from "@/constants";
import { useLocalStorage } from "@/hooks";

/**
 * Reviewer identity: a display name kept in localStorage. No auth — this is an
 * internal review tool and the name is purely attribution.
 */
export function useDisplayName() {
  const [name, setName] = useLocalStorage<string>(
    STORAGE_KEYS.commentAuthor,
    "",
  );
  return { name: name.trim(), setName };
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}
