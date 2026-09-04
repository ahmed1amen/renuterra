import { ChevronDown, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Demo, SectionHeader, Swatch } from "../components";

const VARIANTS = [
  "default",
  "outline",
  "secondary",
  "destructive",
  "ghost",
  "link",
] as const;
const SIZES = ["sm", "default", "lg"] as const;

export default function ButtonsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Buttons"
        description="Variants, sizes, states and composition. Built on Base UI — compose with the render prop, not asChild."
      />

      <Demo title="Variants">
        <div className="flex flex-wrap items-center gap-3">
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      </Demo>

      <Demo title="Sizes">
        <div className="flex flex-wrap items-end gap-3">
          {SIZES.map((size) => (
            <Button key={size} size={size} variant="outline">
              {size}
            </Button>
          ))}
          <Button size="icon" variant="outline" aria-label="Add">
            <Plus className="size-4" />
          </Button>
        </div>
      </Demo>

      <Demo title="With icons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus className="size-4" />
            Add record
          </Button>
          <Button variant="outline">
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button variant="destructive">
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </Demo>

      <Demo title="States">
        <div className="flex flex-wrap items-center gap-6">
          <Swatch label="disabled">
            <Button disabled>Disabled</Button>
          </Swatch>
          <Swatch label="disabled outline">
            <Button variant="outline" disabled>
              Disabled
            </Button>
          </Swatch>
        </div>
      </Demo>

      <Demo title="Split button">
        <div className="flex items-center">
          <Button size="sm" className="rounded-e-none">
            <Download className="size-4" />
            Export
          </Button>
          <Button
            size="icon"
            className="rounded-s-none border-s border-s-white/20"
            aria-label="More export options"
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </Demo>
    </div>
  );
}
