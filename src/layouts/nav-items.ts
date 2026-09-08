import { BarChart3, Home, type LucideIcon, Palette } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match the pathname exactly instead of by prefix. */
  exact?: boolean;
};

/** Primary navigation, shared by the desktop rail and the mobile drawer. */
export const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
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
];

export const isNavItemActive = (item: NavItem, pathname: string) =>
  item.exact ? pathname === item.href : pathname.startsWith(item.href);
