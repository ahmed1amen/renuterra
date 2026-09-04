import { Demo, SectionHeader } from "../components";

const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "popover",
  "primary",
  "secondary",
  "muted",
  "accent",
  "destructive",
  "border",
  "input",
  "ring",
];

const TYPE_SCALE = [
  { name: "text-xs", className: "text-xs" },
  { name: "text-sm", className: "text-sm" },
  { name: "text-base", className: "text-base" },
  { name: "text-lg", className: "text-lg" },
  { name: "text-xl", className: "text-xl" },
  { name: "text-2xl", className: "text-2xl" },
  { name: "text-3xl", className: "text-3xl" },
  { name: "text-4xl", className: "text-4xl" },
];

const RADII = [
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-2xl",
];

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Overview"
        description="Design tokens defined in src/app/globals.css. Every value is theme-aware — toggle the theme in the topbar to see both palettes."
      />

      <Demo title="Color tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLOR_TOKENS.map((token) => (
            <div key={token} className="space-y-1.5">
              <div
                className="border-border h-14 w-full rounded-lg border"
                style={{ background: `var(--color-${token})` }}
              />
              <p className="font-mono text-xs">--{token}</p>
            </div>
          ))}
        </div>
      </Demo>

      <Demo title="Typography scale">
        <div className="space-y-3">
          {TYPE_SCALE.map(({ name, className }) => (
            <div key={name} className="flex items-baseline gap-4">
              <code className="text-muted-foreground w-20 shrink-0 font-mono text-xs">
                {name}
              </code>
              <span className={className}>The quick brown fox</span>
            </div>
          ))}
        </div>
      </Demo>

      <Demo title="Font families">
        <div className="space-y-3">
          <p className="font-sans">
            font-sans — Geist. Body copy and UI labels.
          </p>
          <p className="font-mono">
            font-mono — Geist Mono. Codes, IDs, numeric data.
          </p>
        </div>
      </Demo>

      <Demo title="Radii">
        <div className="flex flex-wrap gap-4">
          {RADII.map((radius) => (
            <div key={radius} className="space-y-1.5">
              <div
                className={`bg-muted border-border size-16 border ${radius}`}
              />
              <p className="text-muted-foreground font-mono text-xs">
                {radius}
              </p>
            </div>
          ))}
        </div>
      </Demo>
    </div>
  );
}
