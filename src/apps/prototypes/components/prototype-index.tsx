"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePlaygroundParams } from "../hooks";
import { PROTOTYPE_STATUSES, PROTOTYPES } from "../registry";
import { StatusBadge } from "./status-badge";

/** Landing view at /prototypes: one card per registry entry, grouped by status. */
export function PrototypeIndex() {
  const { withParams } = usePlaygroundParams();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">All prototypes</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Pick a screen to open it in the device frame. Leave feedback with the
          Vercel Toolbar on any preview deployment.
        </p>
      </div>

      {PROTOTYPE_STATUSES.map((group) => {
        const entries = PROTOTYPES.filter((p) => p.status === group.id);
        if (entries.length === 0) return null;
        return (
          <section key={group.id} className="space-y-3">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {group.label}
            </h3>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {entries.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={withParams(`/prototypes/${p.slug}`)}
                    className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Card className="hover:ring-foreground/20 h-full transition-shadow hover:shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle>{p.title}</CardTitle>
                          <StatusBadge status={p.status} />
                        </div>
                        <CardDescription>{p.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <span className="text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 font-mono text-xs transition-colors">
                          /prototypes/{p.slug}
                          <ArrowRight className="size-3" aria-hidden />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
