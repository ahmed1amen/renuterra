/** One row from `page_comments`, camel-cased for the app. */
export type PageComment = {
  id: string;
  /** App pathname the pin lives on, e.g. "/dashboard". */
  page: string;
  /** 0-100, % of the page content area width. */
  x: number;
  /** 0-100, % of the page content area height. */
  y: number;
  author: string;
  body: string;
  /** Optional attached screenshot as a base64 data URL, or null. */
  image: string | null;
  resolved: boolean;
  parentId: string | null;
  createdAt: string;
};

export type NewComment = {
  page: string;
  x: number;
  y: number;
  author: string;
  body: string;
  image?: string | null;
  parentId?: string | null;
};

export type CommentPatch = Partial<Pick<PageComment, "body" | "resolved">>;

/** A top-level comment with its replies, in chronological order. */
export type CommentThread = {
  root: PageComment;
  replies: PageComment[];
};

export type ThreadFilter = "open" | "resolved" | "all";
