"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** One lookup table: title, row count, a fake "Add" and the table itself. */
export function LookupCard({
  title,
  description,
  count,
  addLabel,
  note,
  children,
}: {
  title: string;
  description: string;
  count: number;
  addLabel: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title}
          <span className="text-muted-foreground ms-2 font-mono text-xs font-normal tabular-nums">
            {count}
          </span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info(addLabel, {
                description: "Editing lookups comes with the admin backend.",
              })
            }
          >
            <Plus data-icon="inline-start" />
            {addLabel}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {note}
        {children}
      </CardContent>
    </Card>
  );
}

/** Small mono chip for a code. */
export function CodeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-border inline-flex h-[22px] items-center rounded-md border px-1.5 font-mono text-xs whitespace-nowrap">
      {children}
    </span>
  );
}

export function Chips({ codes }: { codes: string[] }) {
  if (!codes.length) return <span className="text-muted-foreground">None</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {codes.map((code) => (
        <CodeChip key={code}>{code}</CodeChip>
      ))}
    </span>
  );
}
