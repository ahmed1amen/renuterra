import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Demo, SectionHeader } from "../components";

export default function FormsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Forms"
        description="Inputs and labels. Wire real forms with React Hook Form + a Zod resolver."
      />

      <Demo title="Text input">
        <div className="grid max-w-sm gap-2">
          <Label htmlFor="sg-email">Email</Label>
          <Input id="sg-email" type="email" placeholder="you@example.com" />
        </div>
      </Demo>

      <Demo title="States">
        <div className="grid max-w-sm gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sg-disabled">Disabled</Label>
            <Input id="sg-disabled" disabled placeholder="Not editable" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-invalid">Invalid</Label>
            <Input id="sg-invalid" aria-invalid defaultValue="not-an-email" />
            <p className="text-destructive text-xs">
              Enter a valid email address.
            </p>
          </div>
        </div>
      </Demo>

      <Demo title="Form layout">
        <form className="grid max-w-sm gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sg-name">Name</Label>
            <Input id="sg-name" placeholder="Jane Doe" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-org">Organisation</Label>
            <Input id="sg-org" placeholder="Renuterra" />
          </div>
          <div className="flex gap-2">
            <Button type="button">Save</Button>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </Demo>
    </div>
  );
}
