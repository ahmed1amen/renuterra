/**
 * Sample content for the styleguide. Waste-management CRM examples so every
 * demo reads like the product, not lorem ipsum.
 */
import type { StatusTone, WasteStream } from "@/components/shared";

export const BRAND_PALETTE = [
  {
    name: "Limegreen",
    hex: "#68C828",
    use: "Primary actions, focus, recyclable",
  },
  { name: "Greenyellow", hex: "#98E810", use: "Dark-mode ring, chart-1" },
  {
    name: "Greenyellow 2",
    hex: "#B8F800",
    use: "Dark-mode primary, logo highlight",
  },
  { name: "Charcoal", hex: "#404040", use: "Text, wordmark" },
  { name: "Navy", hex: "#051683", use: "Links, info, chart-2" },
  { name: "Lavender", hex: "#E4E5F4", use: "Info tint, navy avatars" },
  { name: "Lightslategray", hex: "#9B97C7", use: "Chart-3, C&D stream" },
  { name: "Snow", hex: "#FCFBF7", use: "Page background" },
  { name: "Ivory", hex: "#FCFDEE", use: "Sidebar" },
  { name: "Whitesmoke", hex: "#F0F1ED", use: "Muted / secondary" },
];

export const LIME_RAMP = [
  ["50", "#F6FEE6"],
  ["100", "#EAF8DF"],
  ["200", "#D6F5B0"],
  ["300", "#B8F800"],
  ["400", "#98E810"],
  ["500", "#68C828"],
  ["600", "#4FA31C"],
  ["700", "#3B7D14"],
  ["800", "#2E5A12"],
  ["900", "#1D3A0B"],
].map(([step, hex], i) => ({ step, hex, dark: i >= 6 }));

export const NAVY_RAMP = [
  ["50", "#EEF0FA"],
  ["100", "#E4E5F4"],
  ["300", "#9B97C7"],
  ["500", "#2E3EA6"],
  ["700", "#051683"],
  ["900", "#030D4D"],
].map(([step, hex], i) => ({ step, hex, dark: i >= 3 }));

export const SEMANTIC_TOKENS = [
  ["--background", "#FCFBF7", "#14170F", "Page ground"],
  ["--foreground", "#404040", "#F1F2EA", "Body text"],
  ["--card", "#FFFFFF", "#1C2016", "Cards, table shells, popovers"],
  [
    "--primary",
    "#68C828",
    "#B8F800",
    "Primary button, active nav bar, progress",
  ],
  [
    "--primary-foreground",
    "#142105",
    "#142105",
    "Text on primary — always dark",
  ],
  ["--secondary", "#F0F1ED", "#262B1F", "Secondary button, chips"],
  ["--muted", "#F0F1ED", "#262B1F", "Table headers, skeletons, hovers"],
  [
    "--muted-foreground",
    "#737870",
    "#A0A596",
    "Captions, labels, placeholders",
  ],
  ["--accent", "#EAF8DF", "#26361A", "Selected row / nav item, count pills"],
  ["--accent-foreground", "#2E5A12", "#D6F5B0", "Text on accent"],
  ["--destructive", "#D9463E", "#F0665E", "Errors, delete, missed"],
  ["--border", "#E4E5DD", "white 10%", "Dividers, card rings"],
  ["--input", "#DCDDD4", "white 14%", "Field borders"],
  ["--ring", "#68C828", "#98E810", "Focus ring"],
  ["--sidebar", "#FCFDEE", "#101308", "Sidebar ground"],
  [
    "--chart-1…5",
    "lime · navy · slate · yellow-green · charcoal",
    "same, lightened",
    "Series order for non-stream charts",
  ],
].map(([name, light, dark, use]) => ({
  name,
  light,
  dark,
  use,
  swatch: `var(${name.split("…")[0]})`,
}));

export const STATUS_TONES: { tone: StatusTone; name: string; vars: string }[] =
  [
    { tone: "success", name: "Success", vars: "--success / --success-bg" },
    { tone: "warning", name: "Warning", vars: "--warning / --warning-bg" },
    { tone: "info", name: "Info", vars: "--info / --info-bg" },
    {
      tone: "destructive",
      name: "Destructive",
      vars: "--destructive / --destructive-bg",
    },
  ];

export const TYPE_SCALE = [
  [
    "text-4xl",
    "36 / 40 · 600",
    "text-4xl font-semibold tracking-[-.025em]",
    "Dashboard",
  ],
  [
    "text-3xl",
    "30 / 36 · 600",
    "text-3xl font-semibold tracking-[-.02em]",
    "Waste reports & analytics",
  ],
  [
    "text-2xl",
    "24 / 32 · 600",
    "text-2xl font-semibold tracking-[-.02em]",
    "Page titles — American Hospital Dubai",
  ],
  [
    "text-xl",
    "20 / 28 · 600",
    "text-xl font-semibold tracking-[-.01em]",
    "Section headers inside a page",
  ],
  [
    "text-lg",
    "18 / 28 · 500",
    "text-lg font-medium",
    "Card titles and dialog headings",
  ],
  [
    "text-base",
    "16 / 24 · 400",
    "text-base",
    "Long-form body: notes, descriptions, emails to clients",
  ],
  [
    "text-sm",
    "14 / 20 · 400",
    "text-sm",
    "Default UI text — table cells, buttons, form values",
  ],
  [
    "text-xs",
    "12 / 16 · 500",
    "text-xs font-medium",
    "Badges, captions, column headers (uppercase, +.04em)",
  ],
].map(([cls, spec, className, sample]) => ({ cls, spec, className, sample }));

export const SPACING = [
  ["space-1", 4],
  ["space-2", 8],
  ["space-3", 12],
  ["space-4", 16],
  ["space-6", 24],
  ["space-8", 32],
  ["space-12", 48],
].map(([name, px]) => ({ name: String(name), px: Number(px) }));

export const RADII = [
  { name: "sm · 6", className: "rounded-sm" },
  { name: "md · 8", className: "rounded-md" },
  { name: "lg · 10", className: "rounded-lg" },
  { name: "xl · 14", className: "rounded-xl" },
  { name: "pill", className: "rounded-full" },
];

type BadgeSpec = { label: string; tone: StatusTone };
const b = (label: string, tone: StatusTone): BadgeSpec => ({ label, tone });

export const BADGE_GROUPS: { title: string; items: BadgeSpec[] }[] = [
  {
    title: "Quotes",
    items: [
      b("Draft", "neutral"),
      b("Sent", "info"),
      b("Awaiting client", "warning"),
      b("Accepted", "success"),
      b("Declined", "destructive"),
      b("Expired", "neutral"),
    ],
  },
  {
    title: "Collections",
    items: [
      b("Scheduled", "neutral"),
      b("En route", "info"),
      b("Delayed", "warning"),
      b("Completed", "success"),
      b("Missed", "destructive"),
    ],
  },
  {
    title: "Invoices",
    items: [
      b("Draft", "neutral"),
      b("Sent", "info"),
      b("Partially paid", "warning"),
      b("Paid", "success"),
      b("Overdue", "destructive"),
    ],
  },
  {
    title: "Tickets & compliance",
    items: [
      b("Open", "info"),
      b("Waiting on client", "warning"),
      b("Resolved", "success"),
      b("Permit valid", "success"),
      b("Expiring soon", "warning"),
      b("Expired", "destructive"),
    ],
  },
];

export type SampleInvoice = {
  id: string;
  client: string;
  stream: WasteStream;
  issued: string;
  amount: string;
  status: string;
  tone: StatusTone;
  selected: boolean;
};

export const INVOICES: SampleInvoice[] = [
  {
    id: "INV-2026-1187",
    client: "American Hospital Dubai",
    stream: "medical",
    issued: "1 Sep 2026",
    amount: "AED 42,000.00",
    status: "Paid",
    tone: "success",
    selected: false,
  },
  {
    id: "INV-2026-1186",
    client: "Al Shwaib Trading",
    stream: "cd",
    issued: "28 Aug 2026",
    amount: "AED 58,900.00",
    status: "Overdue",
    tone: "destructive",
    selected: true,
  },
  {
    id: "INV-2026-1185",
    client: "Emirates Towers",
    stream: "food",
    issued: "28 Aug 2026",
    amount: "AED 31,200.00",
    status: "Sent",
    tone: "info",
    selected: false,
  },
  {
    id: "INV-2026-1184",
    client: "Marina Gate Residences",
    stream: "general",
    issued: "25 Aug 2026",
    amount: "AED 12,800.00",
    status: "Draft",
    tone: "neutral",
    selected: false,
  },
  {
    id: "INV-2026-1183",
    client: "Sparklo",
    stream: "recyclable",
    issued: "22 Aug 2026",
    amount: "AED 3,550.00",
    status: "Partially paid",
    tone: "warning",
    selected: true,
  },
  {
    id: "INV-2026-1182",
    client: "Iranian Hospital",
    stream: "medical",
    issued: "20 Aug 2026",
    amount: "AED 22,400.00",
    status: "Paid",
    tone: "success",
    selected: false,
  },
];

export type SampleClient = {
  name: string;
  initials: string;
  sector: string;
  sites: string;
  streams: WasteStream[];
  tonnage: string;
  mrr: string;
  status: string;
  tone: StatusTone;
};

export const CLIENTS: SampleClient[] = [
  {
    name: "American Hospital Dubai",
    initials: "AH",
    sector: "Healthcare",
    sites: "3 sites · Oud Metha",
    streams: ["medical", "recyclable", "general"],
    tonnage: "18.4 t",
    mrr: "AED 42,000",
    status: "Active",
    tone: "success",
  },
  {
    name: "Sparklo",
    initials: "SP",
    sector: "Recycling tech",
    sites: "12 sites · Dubai",
    streams: ["recyclable"],
    tonnage: "3.2 t",
    mrr: "AED 3,550",
    status: "Quote sent",
    tone: "warning",
  },
  {
    name: "Emirates Towers",
    initials: "ET",
    sector: "Hospitality",
    sites: "1 site · DIFC",
    streams: ["food", "recyclable", "general"],
    tonnage: "26.0 t",
    mrr: "AED 31,200",
    status: "Active",
    tone: "success",
  },
  {
    name: "Al Shwaib Trading",
    initials: "AS",
    sector: "Construction",
    sites: "4 sites · Al Quoz",
    streams: ["cd", "hazardous"],
    tonnage: "61.5 t",
    mrr: "AED 58,900",
    status: "Overdue",
    tone: "destructive",
  },
  {
    name: "Iranian Hospital",
    initials: "IH",
    sector: "Healthcare",
    sites: "1 site · Al Wasl",
    streams: ["medical", "general"],
    tonnage: "9.1 t",
    mrr: "AED 22,400",
    status: "Active",
    tone: "success",
  },
  {
    name: "Marina Gate Residences",
    initials: "MG",
    sector: "Residential",
    sites: "2 towers · Marina",
    streams: ["general", "recyclable", "food"],
    tonnage: "14.7 t",
    mrr: "AED 12,800",
    status: "Onboarding",
    tone: "info",
  },
  {
    name: "Dubai Festival Plaza",
    initials: "DF",
    sector: "Retail",
    sites: "1 site · Jebel Ali",
    streams: ["recyclable", "food", "general"],
    tonnage: "22.3 t",
    mrr: "AED 19,600",
    status: "Active",
    tone: "success",
  },
  {
    name: "Quorum Labs",
    initials: "QL",
    sector: "Healthcare",
    sites: "1 site · Healthcare City",
    streams: ["medical", "hazardous"],
    tonnage: "2.4 t",
    mrr: "—",
    status: "Churned",
    tone: "neutral",
  },
];

export type SampleStop = {
  time: string;
  client: string;
  site: string;
  stream: WasteStream;
  driver: string;
  status: string;
  tone: StatusTone;
};

export const SCHEDULE: SampleStop[] = [
  {
    time: "06:30",
    client: "American Hospital Dubai",
    site: "Main building, dock B",
    stream: "medical",
    driver: "A. Rahman",
    status: "Completed",
    tone: "success",
  },
  {
    time: "07:15",
    client: "Emirates Towers",
    site: "Loading bay 2",
    stream: "food",
    driver: "M. Youssef",
    status: "En route",
    tone: "info",
  },
  {
    time: "08:00",
    client: "Marina Gate Residences",
    site: "Tower 1 basement",
    stream: "general",
    driver: "A. Rahman",
    status: "Scheduled",
    tone: "neutral",
  },
  {
    time: "09:30",
    client: "Al Shwaib Trading",
    site: "Al Quoz site 3",
    stream: "cd",
    driver: "K. Singh",
    status: "Delayed",
    tone: "warning",
  },
  {
    time: "11:00",
    client: "Sparklo",
    site: "RVM route DXB-07",
    stream: "recyclable",
    driver: "M. Youssef",
    status: "Missed",
    tone: "destructive",
  },
];

export function driverInitials(name: string) {
  return name
    .split(/[.\s]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export type SampleKpi = {
  label: string;
  period: string;
  value: string;
  unit: string;
  delta: string;
  deltaTone: StatusTone;
  spark: number[];
  sparkClass: string;
};

export const KPIS: SampleKpi[] = [
  {
    label: "Tonnage collected",
    period: "Aug",
    value: "1,284",
    unit: "t",
    delta: "+8.2% vs Jul",
    deltaTone: "success",
    spark: [0.3, 0.35, 0.4, 0.38, 0.5, 0.62, 0.7, 0.85],
    sparkClass: "stroke-chart-1",
  },
  {
    label: "Diversion rate",
    period: "Aug",
    value: "56",
    unit: "%",
    delta: "+3 pts · target 60",
    deltaTone: "success",
    spark: [0.4, 0.42, 0.45, 0.5, 0.48, 0.52, 0.55, 0.58],
    sparkClass: "stroke-chart-2",
  },
  {
    label: "Open quotes",
    period: "now",
    value: "14",
    unit: "AED 386k",
    delta: "4 expiring this week",
    deltaTone: "warning",
    spark: [0.5, 0.6, 0.55, 0.7, 0.65, 0.8, 0.75, 0.7],
    sparkClass: "stroke-chart-3",
  },
  {
    label: "Overdue invoices",
    period: "now",
    value: "5",
    unit: "AED 86k",
    delta: "−2 since last week",
    deltaTone: "success",
    spark: [0.9, 0.8, 0.85, 0.7, 0.6, 0.65, 0.5, 0.45],
    sparkClass: "stroke-destructive",
  },
];

/** Monthly stream mix as percentages of column height. */
export const TONNAGE_BARS = [
  ["Jan", 22, 12, 18, 30],
  ["Feb", 24, 12, 16, 28],
  ["Mar", 28, 14, 18, 26],
  ["Apr", 30, 13, 17, 26],
  ["May", 34, 15, 16, 24],
  ["Jun", 36, 15, 15, 22],
  ["Jul", 40, 16, 14, 20],
  ["Aug", 44, 16, 14, 18],
].map(([month, recyclable, medical, food, general]) => ({
  month: String(month),
  recyclable: Number(recyclable),
  medical: Number(medical),
  food: Number(food),
  general: Number(general),
}));

export const PIPELINE = [
  {
    stage: "Draft",
    count: 3,
    value: "AED 64k",
    pct: 20,
    barClass: "bg-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  {
    stage: "Sent",
    count: 5,
    value: "AED 142k",
    pct: 45,
    barClass: "bg-info",
    dotClass: "bg-info",
  },
  {
    stage: "Awaiting client",
    count: 4,
    value: "AED 118k",
    pct: 38,
    barClass: "bg-warning",
    dotClass: "bg-warning",
  },
  {
    stage: "Accepted (30d)",
    count: 6,
    value: "AED 211k",
    pct: 68,
    barClass: "bg-success",
    dotClass: "bg-success",
  },
];

export const LINE_ITEMS = [
  {
    service: "Recyclable collection — RVM sites",
    freq: "Twice weekly",
    qty: "12",
    unit: "AED 2,400 / site / yr",
    amount: "AED 28,800.00",
    swatchClass: "bg-stream-recyclable",
  },
  {
    service: "PET baling & offtake",
    freq: "Monthly",
    qty: "12",
    unit: "AED 480 / mo",
    amount: "AED 5,760.00",
    swatchClass: "bg-stream-recyclable",
  },
  {
    service: "Live tracking dashboard",
    freq: "Annual",
    qty: "1",
    unit: "AED 3,600 / yr",
    amount: "AED 3,600.00",
    swatchClass: "bg-chart-2",
  },
  {
    service: "Quarterly impact report",
    freq: "Quarterly",
    qty: "4",
    unit: "AED 602.86",
    amount: "AED 2,411.43",
    swatchClass: "bg-chart-3",
  },
];

export const QUOTE_ACTIVITY = [
  {
    actor: "Lina Haddad",
    text: "viewed the quote",
    when: "2h ago",
    icon: "eye",
    tone: "info",
    note: "",
  },
  {
    actor: "Sara Al Ali",
    text: "added an internal note",
    when: "Yesterday",
    icon: "note",
    tone: "neutral",
    note: "Lina asked if we can start with 6 sites in October and scale to 12 by January. Pricing holds.",
  },
  {
    actor: "Sara Al Ali",
    text: "sent the quote to lina@sparklo.ae",
    when: "1 Sep",
    icon: "send",
    tone: "success",
    note: "",
  },
  {
    actor: "Sara Al Ali",
    text: "created the quote from web enquiry #4471",
    when: "1 Sep",
    icon: "check",
    tone: "neutral",
    note: "",
  },
] as const;

export const QUOTE_STEPS = [
  { label: "Created", date: "1 Sep", state: "done" },
  { label: "Sent", date: "1 Sep", state: "done" },
  { label: "Viewed by client", date: "4 Sep", state: "done" },
  { label: "Accepted", date: "—", state: "current" },
  { label: "Contract signed", date: "—", state: "todo" },
] as const;

export const CRM_NAV = [
  { icon: "home", label: "Dashboard" },
  { icon: "users", label: "Clients & contacts", count: 612 },
  { icon: "quote", label: "Quotes & pricing", count: 14 },
  { icon: "calendar", label: "Collection schedules" },
  { icon: "invoice", label: "Invoices & payments", count: 5 },
  { icon: "chart", label: "Waste reports" },
  { icon: "truck", label: "Fleet & drivers" },
  { icon: "ticket", label: "Support tickets", count: 2 },
  { icon: "shield", label: "Compliance" },
] as const;

export const SKELETON_ROWS = [
  ["66%", "45%"],
  ["52%", "38%"],
  ["70%", "50%"],
  ["58%", "30%"],
].map(([w1, w2]) => ({ w1, w2 }));
