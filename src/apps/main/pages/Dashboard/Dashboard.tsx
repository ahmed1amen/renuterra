import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Next.js 16 · React 19 · Tailwind v4 · shadcn/ui · TanStack Query"
        actions={<Button size="sm">New</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Start here</CardTitle>
          <CardDescription>
            Edit{" "}
            <code className="font-mono text-xs">
              src/apps/main/pages/Dashboard/Dashboard.tsx
            </code>{" "}
            to build the first screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Get started</Button>
        </CardContent>
      </Card>
    </>
  );
}
