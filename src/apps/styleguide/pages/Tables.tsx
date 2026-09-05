import { Filter, MoreHorizontal, Search } from "lucide-react";
import { findStream, StatusPill, StreamSwatch } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Code, SectionHeader } from "../components";
import { INVOICES } from "../data";

export default function TablesPage() {
  const selected = INVOICES.filter((r) => r.selected).length;

  return (
    <div className="space-y-5">
      <SectionHeader
        number="09"
        title="Tables & lists"
        description={
          <>
            Muted header band, 1px row rules, 44px rows. Figures right-aligned
            in mono with tabular numerals. Hover tints the row with{" "}
            <Code>--muted</Code> at 50%; selection uses <Code>--accent</Code>.
          </>
        }
      />
      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex">
              <Search
                className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2"
                aria-hidden
              />
              <Input
                placeholder="Filter invoices"
                aria-label="Filter invoices"
                className="h-[30px] w-[220px] ps-8 text-[13px]"
              />
            </span>
            <Button variant="outline" size="sm">
              <Filter data-icon="inline-start" />
              Status
              <span className="bg-accent text-accent-foreground rounded-full px-1.5 text-[11px]">
                2
              </span>
            </Button>
          </div>
          <div className="text-muted-foreground text-[12.5px]">
            38 invoices ·{" "}
            <span className="text-foreground font-medium">
              {selected} selected
            </span>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="w-9">
                <Checkbox aria-label="Select all" />
              </TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Stream</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map((r) => (
              <TableRow
                key={r.id}
                data-state={r.selected ? "selected" : undefined}
                className={cn(
                  "h-11",
                  r.selected && "bg-accent hover:bg-accent",
                )}
              >
                <TableCell>
                  <Checkbox
                    aria-label={`Select ${r.id}`}
                    defaultChecked={r.selected}
                  />
                </TableCell>
                <TableCell className="font-mono text-[12.5px]">
                  {r.id}
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {r.client}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <StreamSwatch stream={r.stream} />
                    {findStream(r.stream).label}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.issued}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {r.amount}
                </TableCell>
                <TableCell className="text-center">
                  <StatusPill tone={r.tone}>{r.status}</StatusPill>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More"
                    className="text-muted-foreground"
                  >
                    <MoreHorizontal />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-border text-muted-foreground flex items-center justify-between border-t px-4 py-2.5 text-[12.5px]">
          <span>Showing 1–6 of 38</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
