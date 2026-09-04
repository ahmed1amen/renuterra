import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Demo, SectionHeader } from "../components";

export default function CardsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Cards"
        description="Surface container for grouped content."
      />

      <Demo title="Basic">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Supporting description text.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Body content sits here.</p>
          </CardContent>
        </Card>
      </Demo>

      <Demo title="With footer actions">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Confirm changes</CardTitle>
            <CardDescription>
              This action updates the live record.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-2">
            <Button size="sm">Confirm</Button>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </Demo>

      <Demo title="Stat grid">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total", value: "1,284" },
            { label: "Active", value: "1,097" },
            { label: "Suspended", value: "187" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {stat.value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Demo>
    </div>
  );
}
