import type { ComponentType } from "react";
import {
  ActivityFeed,
  ContactList,
  DealPipeline,
  LeadDetail,
  LeadList,
} from "./screens";

export type PrototypeStatus = "draft" | "review" | "approved";

export type Prototype = {
  /** URL segment: /prototypes/<slug>. Kebab-case, unique. */
  slug: string;
  title: string;
  description: string;
  status: PrototypeStatus;
  component: ComponentType;
};

/** Display order for the sidebar groups and the index page. */
export const PROTOTYPE_STATUSES: { id: PrototypeStatus; label: string }[] = [
  { id: "review", label: "In review" },
  { id: "draft", label: "Draft" },
  { id: "approved", label: "Approved" },
];

/**
 * Single source of truth for the playground. To add a prototype, drop a screen
 * in `./screens/` and append one entry here — routing, sidebar, index cards,
 * static params and tests all derive from this array.
 */
export const PROTOTYPES: Prototype[] = [
  {
    slug: "lead-list",
    title: "Lead list",
    description:
      "Inbox of inbound and outbound leads with search, status filters and fit score.",
    status: "review",
    component: LeadList,
  },
  {
    slug: "lead-detail",
    title: "Lead detail",
    description:
      "Single lead with quick actions, key fields and its recent activity.",
    status: "review",
    component: LeadDetail,
  },
  {
    slug: "contact-list",
    title: "Contact list",
    description: "Alphabetical directory of people across every account.",
    status: "draft",
    component: ContactList,
  },
  {
    slug: "deal-pipeline",
    title: "Deal pipeline",
    description:
      "Pipeline totals and a stage-by-stage view of every open deal.",
    status: "draft",
    component: DealPipeline,
  },
  {
    slug: "activity-feed",
    title: "Activity feed",
    description:
      "Chronological timeline of calls, emails, meetings, notes and tasks.",
    status: "approved",
    component: ActivityFeed,
  },
];

export function findPrototype(slug?: string): Prototype | undefined {
  return PROTOTYPES.find((p) => p.slug === slug);
}
