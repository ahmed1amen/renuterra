import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CreditCard,
  Grid,
  Layout,
  ListFilter,
  Loader,
  Palette,
  Sparkles,
  Tag,
} from "lucide-react";
import type { ComponentType } from "react";
import ButtonsPage from "./pages/Buttons";
import CardsPage from "./pages/Cards";
import DisplayPage from "./pages/Display";
import DropdownsPage from "./pages/Dropdowns";
import FeedbackPage from "./pages/Feedback";
import FormsPage from "./pages/Forms";
import LayoutPage from "./pages/Layout";
import OverviewPage from "./pages/Overview";
import StatesPage from "./pages/States";

export type StyleguideSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
};

export const STYLEGUIDE_SECTIONS: StyleguideSection[] = [
  { id: "overview", label: "Overview", icon: Palette, component: OverviewPage },
  { id: "buttons", label: "Buttons", icon: Sparkles, component: ButtonsPage },
  { id: "forms", label: "Forms", icon: Grid, component: FormsPage },
  { id: "cards", label: "Cards", icon: CreditCard, component: CardsPage },
  { id: "display", label: "Display", icon: Tag, component: DisplayPage },
  {
    id: "dropdowns",
    label: "Dropdowns",
    icon: ListFilter,
    component: DropdownsPage,
  },
  { id: "feedback", label: "Feedback", icon: Bell, component: FeedbackPage },
  { id: "states", label: "States", icon: Loader, component: StatesPage },
  { id: "layout", label: "Layout", icon: Layout, component: LayoutPage },
];

export const DEFAULT_SECTION_ID = "overview";

export function findSection(id?: string): StyleguideSection {
  return STYLEGUIDE_SECTIONS.find((s) => s.id === id) ?? STYLEGUIDE_SECTIONS[0];
}
