import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Demo, SectionHeader } from "../components";

export default function LayoutPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Layout"
        description="Page chrome. AppLayout wraps every product route; PageHeader opens every screen."
      />

      <Demo title="PageHeader">
        <PageHeader
          title="Records"
          description="Everything in the workspace."
        />
      </Demo>

      <Demo title="PageHeader with actions">
        <PageHeader
          title="Records"
          description="Everything in the workspace."
          actions={
            <>
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button size="sm">New</Button>
            </>
          }
        />
      </Demo>

      <Demo title="Content widths">
        <div className="space-y-3 text-sm">
          <p>
            <code className="font-mono text-xs">AppLayout</code> constrains
            content to <code className="font-mono text-xs">max-w-6xl</code> with{" "}
            <code className="font-mono text-xs">px-6 py-8</code>.
          </p>
          <p className="text-muted-foreground">
            The styleguide runs outside AppLayout so it can use the full
            viewport.
          </p>
        </div>
      </Demo>
    </div>
  );
}
