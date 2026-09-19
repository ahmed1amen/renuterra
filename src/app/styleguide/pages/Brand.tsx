import { BrandLogo } from "@/components/shared";
import { Code, Note, SectionHeader } from "../components";

const ASSUMPTIONS = [
  "Colors from the brand list: greens #B8F800 / #98E810 / #68C828, charcoal #404040, navy #051683, lavender #E4E5F4, snow/ivory/whitesmoke.",
  "Lime is bright, so primary buttons take dark text — white on lime fails contrast.",
  "Type: Plus Jakarta Sans (matches the rounded wordmark) + Geist Mono for IDs and figures.",
  "Used by staff and clients — same tokens, the client portal just hides internal modules.",
];

export default function BrandPage() {
  return (
    <div className="space-y-14">
      <section className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-10">
        <div>
          <div className="text-lime-700 font-mono text-[11px] tracking-[.1em] uppercase">
            Renuterra · myRenuterra CRM
          </div>
          <h2 className="my-2.5 mb-4 text-[40px] leading-[1.1] font-semibold tracking-[-.025em]">
            One identity, from the website to the workspace.
          </h2>
          <p className="text-muted-foreground max-w-[60ch] text-base text-pretty">
            This guide translates renuterra.com's brand — lime-green leaf mark,
            charcoal wordmark, navy and lavender accents — into the token set
            the CRM reads. Every token keeps the shadcn/ui name wired into{" "}
            <Code>globals.css</Code>, so components pick it up without changes.
          </p>
        </div>
        <Note title="Assumptions">
          <ul className="flex list-disc flex-col gap-1.5 pl-4">
            {ASSUMPTIONS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Note>
      </section>

      <section className="space-y-5">
        <SectionHeader number="01" title="Brand" />
        <div className="grid grid-cols-2 gap-4">
          <div className="border-border flex min-h-[180px] items-center justify-center rounded-xl border bg-white p-10">
            <BrandLogo height={70} />
          </div>
          <div className="border-border relative flex min-h-[180px] items-center justify-center rounded-xl border bg-[#14170F] p-10">
            <BrandLogo
              height={55}
              plate
              className="rounded-[10px] px-5 py-3.5"
            />
            <span className="absolute right-3.5 bottom-3 font-mono text-[11px] text-[#A0A596]">
              Dark UI: logo sits on a white plate until the white variant is
              supplied
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Note title="Leaf mark">
            Eight leaves, lime gradient #B8F800 → #68C828. Use as app icon,
            avatar fallback and loading indicator. Never recolor.
          </Note>
          <Note title="Wordmark">
            Charcoal #404040, "renu" light, "terra" italic. Only as the supplied
            image — the UI type approximates it, never redraws it.
          </Note>
          <Note title="Clear space">
            Keep one leaf-height around the logo. Minimum height 22px in the top
            bar, 16px in email footers.
          </Note>
        </div>
      </section>
    </div>
  );
}
