import type { ComponentType } from "react";
import BadgesPage from "./pages/Badges";
import BrandPage from "./pages/Brand";
import ButtonsPage from "./pages/Buttons";
import CardsPage from "./pages/Cards";
import ChartsPage from "./pages/Charts";
import ColorPage from "./pages/Color";
import FormsPage from "./pages/Forms";
import MenusPage from "./pages/Menus";
import NavigationPage from "./pages/Navigation";
import ScreensPage from "./pages/Screens";
import SpacingPage from "./pages/Spacing";
import StatesPage from "./pages/States";
import TablesPage from "./pages/Tables";
import TypographyPage from "./pages/Typography";

export type StyleguideGroup = "Foundations" | "Components" | "Screens";

export type StyleguideSection = {
  id: string;
  label: string;
  /** Two-digit section number shown above the title. */
  number: string;
  group: StyleguideGroup;
  component: ComponentType;
};

export const STYLEGUIDE_GROUPS: StyleguideGroup[] = [
  "Foundations",
  "Components",
  "Screens",
];

export const STYLEGUIDE_SECTIONS: StyleguideSection[] = [
  {
    id: "brand",
    label: "Brand",
    number: "01",
    group: "Foundations",
    component: BrandPage,
  },
  {
    id: "color",
    label: "Color",
    number: "02",
    group: "Foundations",
    component: ColorPage,
  },
  {
    id: "typography",
    label: "Typography",
    number: "03",
    group: "Foundations",
    component: TypographyPage,
  },
  {
    id: "spacing",
    label: "Spacing, radius, elevation",
    number: "04",
    group: "Foundations",
    component: SpacingPage,
  },
  {
    id: "buttons",
    label: "Buttons",
    number: "05",
    group: "Components",
    component: ButtonsPage,
  },
  {
    id: "forms",
    label: "Inputs & forms",
    number: "06",
    group: "Components",
    component: FormsPage,
  },
  {
    id: "badges",
    label: "Status badges & tags",
    number: "07",
    group: "Components",
    component: BadgesPage,
  },
  {
    id: "cards",
    label: "Cards & panels",
    number: "08",
    group: "Components",
    component: CardsPage,
  },
  {
    id: "tables",
    label: "Tables & lists",
    number: "09",
    group: "Components",
    component: TablesPage,
  },
  {
    id: "navigation",
    label: "Sidebar & top nav",
    number: "10",
    group: "Components",
    component: NavigationPage,
  },
  {
    id: "charts",
    label: "KPI tiles & charts",
    number: "11",
    group: "Components",
    component: ChartsPage,
  },
  {
    id: "states",
    label: "Empty, loading, error",
    number: "12",
    group: "Components",
    component: StatesPage,
  },
  {
    id: "menus",
    label: "Menus & toasts",
    number: "13",
    group: "Components",
    component: MenusPage,
  },
  {
    id: "screens",
    label: "Sample CRM screens",
    number: "14",
    group: "Screens",
    component: ScreensPage,
  },
];

export const DEFAULT_SECTION_ID = "brand";

export function findSection(id?: string): StyleguideSection {
  return STYLEGUIDE_SECTIONS.find((s) => s.id === id) ?? STYLEGUIDE_SECTIONS[0];
}
