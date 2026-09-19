import { Truck } from "lucide-react";
import { StatusPill } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SectionHeader } from "../components";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

export default function CardsPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="08"
        title="Cards & panels"
        description="White card on snow ground, 1px 10%-foreground ring, radius 14px, 16px padding. Footer takes a 50% muted band."
      />
      <div className="grid grid-cols-3 items-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-[15px]">
              American Hospital Dubai
            </CardTitle>
            <CardDescription>Healthcare · Oud Metha · 3 sites</CardDescription>
            <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
              <StatusPill tone="success">Active</StatusPill>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-[13px]">
            <Field label="Contract">Medical + Recyclable</Field>
            <Field label="Monthly tonnage">
              <span className="font-mono tabular-nums">18.4 t</span>
            </Field>
            <Field label="Account owner">
              <span className="flex items-center gap-1.5">
                <Avatar size="sm" className="size-5">
                  <AvatarFallback className="bg-lime-200 text-lime-900 text-[9.5px] font-semibold">
                    SA
                  </AvatarFallback>
                </Avatar>
                Sara Al Ali
              </span>
            </Field>
            <Field label="Next collection">Tomorrow, 06:30</Field>
          </CardContent>
          <CardFooter className="justify-between py-3">
            <span className="text-muted-foreground text-xs">
              Updated 2h ago
            </span>
            <Button variant="outline" size="sm">
              Open client
            </Button>
          </CardFooter>
        </Card>

        <Card className="gap-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-[15px]">Quote QT-2026-0418</CardTitle>
            <StatusPill tone="warning">Awaiting client</StatusPill>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-muted-foreground text-[13px]">
              Sparklo · Recyclable collection, 12 RVM sites
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[26px] font-bold tracking-[-.02em]">
                AED 42,600
              </span>
              <span className="text-muted-foreground text-xs">/ year</span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div className="bg-primary h-full w-[66%] rounded-full" />
            </div>
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Sent 3 days ago</span>
              <span>Expires in 11 days</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                Send reminder
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Card
            size="sm"
            className="hover:bg-muted/50 flex-row items-center gap-3 px-3 transition-colors"
          >
            <Avatar size="lg">
              <AvatarFallback className="bg-navy-100 text-navy-700 text-[13px] font-semibold">
                KM
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="truncate font-medium">Khalid Mansoor</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  2h
                </span>
              </div>
              <div className="text-muted-foreground truncate text-xs">
                Facilities Manager · Emirates Towers
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <StatusPill tone="info">Contacted</StatusPill>
                <span className="text-muted-foreground flex items-center gap-1 font-mono text-xs">
                  <span className="bg-muted inline-block h-1.5 w-10 overflow-hidden rounded-full">
                    <span className="bg-foreground block h-full w-[82%]" />
                  </span>
                  82
                </span>
              </div>
            </div>
          </Card>
          <Card size="sm" className="flex-row items-start gap-3 px-3.5">
            <span className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-[9px]">
              <Truck className="size-4" aria-hidden />
            </span>
            <div className="text-[13px]">
              <div className="font-medium">Route DXB-07 completed</div>
              <div className="text-muted-foreground">
                14 stops · 3.2 t recyclable · Driver A. Rahman
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
