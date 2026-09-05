import {
  BarChart3,
  CreditCard,
  FileText,
  LayoutGrid,
  type LucideIcon,
  Map as MapIcon,
  MessageSquare,
  Palette,
  Receipt,
  ShieldCheck,
  Truck,
  Users,
  UsersRound,
} from "lucide-react";

export type AppStatus = "live" | "beta" | "soon";

export type AppEntry = {
  id: string;
  name: string;
  icon: LucideIcon;
  status: AppStatus;
  /** Real route for live apps; dummy apps have none and fire a toast. */
  href?: string;
};

export type AppCategory = {
  id: string;
  label: string;
  /** Token classes for the icon tile, one hue per category. */
  tone: string;
  apps: AppEntry[];
};

/**
 * The app launcher registry. Everything except Dashboard and Styleguide is a
 * dummy for now — cards exist so the home reflects the platform we're
 * building, and clicking one says so.
 */
export const APP_CATEGORIES: AppCategory[] = [
  {
    id: "customer-engagement",
    tone: "bg-info-bg text-info",
    label: "Customer engagement",
    apps: [
      { id: "crm", name: "CRM", icon: Users, status: "beta" },
      {
        id: "communications",
        name: "Communications",
        icon: MessageSquare,
        status: "soon",
      },
    ],
  },
  {
    id: "sales-operations",
    tone: "bg-warning-bg text-warning",
    label: "Sales operations",
    apps: [
      { id: "sales", name: "Sales", icon: BarChart3, status: "beta" },
      { id: "quotes", name: "Quotes", icon: FileText, status: "soon" },
    ],
  },
  {
    id: "field-service",
    tone: "bg-success-bg text-success",
    label: "Field service",
    apps: [
      {
        id: "field-service",
        name: "Field Service",
        icon: Truck,
        status: "beta",
      },
      { id: "routing", name: "Routing", icon: MapIcon, status: "soon" },
    ],
  },
  {
    id: "finance",
    tone: "bg-navy-100 text-navy-700",
    label: "Finance",
    apps: [
      { id: "invoicing", name: "Invoicing", icon: Receipt, status: "soon" },
      { id: "payments", name: "Payments", icon: CreditCard, status: "soon" },
    ],
  },
  {
    id: "operations",
    tone: "bg-muted text-foreground",
    label: "Operations",
    apps: [
      {
        id: "compliance",
        name: "Compliance",
        icon: ShieldCheck,
        status: "soon",
      },
      { id: "people", name: "People", icon: UsersRound, status: "soon" },
    ],
  },
  {
    id: "workspace",
    tone: "bg-accent text-accent-foreground",
    label: "Workspace",
    apps: [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutGrid,
        status: "live",
        href: "/dashboard",
      },
      {
        id: "styleguide",
        name: "Styleguide",
        icon: Palette,
        status: "live",
        href: "/styleguide",
      },
    ],
  },
];

export const ALL_APPS: AppEntry[] = APP_CATEGORIES.flatMap((c) => c.apps);
