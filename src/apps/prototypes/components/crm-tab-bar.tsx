"use client";

import { Activity, Contact, Kanban, Users } from "lucide-react";
import { BottomNav } from "@/components/shared";
import { usePlaygroundParams } from "../hooks";

export type CrmTab = "leads" | "contacts" | "deals" | "activity";

const TABS: { id: CrmTab; label: string; icon: typeof Users; slug: string }[] =
  [
    { id: "leads", label: "Leads", icon: Users, slug: "lead-list" },
    { id: "contacts", label: "Contacts", icon: Contact, slug: "contact-list" },
    { id: "deals", label: "Deals", icon: Kanban, slug: "deal-pipeline" },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      slug: "activity-feed",
    },
  ];

/** The CRM's primary navigation. Tabs jump between the matching prototypes. */
export function CrmTabBar({ active }: { active: CrmTab }) {
  const { withParams } = usePlaygroundParams();

  return (
    <BottomNav
      items={TABS.map((tab) => ({
        label: tab.label,
        icon: tab.icon,
        href: withParams(`/prototypes/${tab.slug}`),
        active: tab.id === active,
      }))}
    />
  );
}
