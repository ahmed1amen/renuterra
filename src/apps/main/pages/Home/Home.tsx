import { ArrowRight, BarChart3, Palette } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DESTINATIONS = [
  {
    href: "/dashboard",
    icon: BarChart3,
    title: "Dashboard",
    description:
      "Pipeline, leads and team activity at a glance, fed by the mock CRM data.",
  },
  {
    href: "/styleguide",
    icon: Palette,
    title: "Styleguide",
    description:
      "The living reference for brand tokens and every component in the design system.",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-6">
        <Badge variant="neutral">Prototype workspace</Badge>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance">
          The Renuterra CRM as real, clickable screens
        </h1>
        <p className="text-muted-foreground max-w-xl text-base">
          Everything here is an interactable prototype — mock data, no real
          logic. Build screens on the design system and review them where the
          pixels are.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Open dashboard
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/styleguide" />}
          >
            View styleguide
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {DESTINATIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="group relative gap-3">
              <CardHeader>
                <span className="bg-muted text-foreground mb-2 flex size-9 items-center justify-center rounded-[9px]">
                  <Icon className="size-4" aria-hidden />
                </span>
                <CardTitle>
                  <Link
                    href={item.href}
                    className="after:absolute after:inset-0"
                  >
                    {item.title}
                  </Link>
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <span className="text-info flex items-center gap-1 text-sm font-medium">
                  Open
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
