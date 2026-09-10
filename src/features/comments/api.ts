import { getSupabase } from "@/lib/supabase";
import type { CommentPatch, NewComment, PageComment } from "./types";

const TABLE = "page_comments";

type Row = {
  id: string;
  page: string;
  x: number;
  y: number;
  author: string;
  body: string;
  image: string | null;
  resolved: boolean;
  parent_id: string | null;
  created_at: string;
};

const fromRow = (row: Row): PageComment => ({
  id: row.id,
  page: row.page,
  x: Number(row.x),
  y: Number(row.y),
  author: row.author,
  body: row.body,
  image: row.image ?? null,
  resolved: row.resolved,
  parentId: row.parent_id,
  createdAt: row.created_at,
});

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

/**
 * Raw Supabase calls. Hooks guard on `getSupabase()` being non-null before
 * enabling queries, so `client()` throwing is a programmer error, not a state.
 */
export const commentsApi = {
  /** Every comment on a page, oldest first. */
  async list(page: string): Promise<PageComment[]> {
    const { data, error } = await client()
      .from(TABLE)
      .select("*")
      .eq("page", page)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as Row[]).map(fromRow);
  },

  async add(input: NewComment): Promise<PageComment> {
    const { data, error } = await client()
      .from(TABLE)
      .insert({
        page: input.page,
        x: input.x,
        y: input.y,
        author: input.author,
        body: input.body,
        image: input.image ?? null,
        parent_id: input.parentId ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as Row);
  },

  async update(id: string, patch: CommentPatch): Promise<PageComment> {
    const { data, error } = await client()
      .from(TABLE)
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as Row);
  },

  async remove(id: string): Promise<void> {
    const { error } = await client().from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },
};
