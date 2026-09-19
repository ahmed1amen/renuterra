import {
  BarChart3,
  FileSignature,
  Gauge,
  Home,
  LayoutDashboard,
  type LucideIcon,
  Palette,
  Radio,
  UserRoundSearch,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match the pathname exactly instead of by prefix. */
  exact?: boolean;
};

export type NavGroup = { label?: string; items: NavItem[] };

/**
 * The app's primary action, pinned above its nav — the thing the sidebar is
 * there to start. Without an `href` it explains itself instead, like the
 * launcher's placeholder tiles.
 */
export type NavAction = {
  label: string;
  icon: LucideIcon;
  href?: string;
  /** Opens a modal the app shell mounts, instead of navigating. */
  opens?: "new-agreement";
};

export type AppNav = {
  id: string;
  /** Shown above the nav when inside an app; omitted for the platform shell. */
  label?: string;
  /** Every pathname under here belongs to this app. */
  basePath: string;
  /** Primary action button above the nav groups. */
  action?: NavAction;
  groups: NavGroup[];
};

/** The shell you get on the launcher and anything not owned by an app. */
export const PLATFORM_NAV: AppNav = {
  id: "platform",
  basePath: "/",
  groups: [
    {
      items: [
        { label: "Home", href: "/", icon: Home, exact: true },
        { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
      ],
    },
    {
      label: "Design system",
      items: [{ label: "Styleguide", href: "/styleguide", icon: Palette }],
    },
  ],
};

/**
 * One entry per app that owns its own sidebar. Order matters only for
 * overlapping base paths — the first match wins.
 */
export const APP_NAVS: AppNav[] = [
  {
    id: "field-service",
    label: "Field Service",
    basePath: "/field-service",
    groups: [
      {
        items: [
          {
            label: "Dashboard",
            href: "/field-service",
            icon: Gauge,
            exact: true,
          },
          { label: "Dispatch", href: "/field-service/dispatch", icon: Radio },
        ],
      },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    basePath: "/sales",
    action: {
      label: "New agreement",
      icon: FileSignature,
      opens: "new-agreement",
    },
    groups: [
      {
        label: "Sell",
        items: [
          {
            label: "Dashboard",
            href: "/sales",
            icon: LayoutDashboard,
            exact: true,
          },
          { label: "Leads", href: "/sales/leads", icon: UserRoundSearch },
        ],
      },
    ],
  },
];

/** The nav the sidebar should render for a pathname. */
export function navForPath(pathname: string): AppNav {
  return (
    APP_NAVS.find(
      (nav) =>
        pathname === nav.basePath || pathname.startsWith(`${nav.basePath}/`),
    ) ?? PLATFORM_NAV
  );
}
