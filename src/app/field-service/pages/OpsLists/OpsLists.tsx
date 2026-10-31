"use client";

import { ListTree } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useOpsMasters,
  useTechnicians,
  useVehicles,
} from "@/features/field-service";
import type { OpsMasters } from "@/mocks";
import {
  CitiesTable,
  DisposalSitesTable,
  EntitiesTable,
  ServiceTypesTable,
  ShiftsTable,
  SkillCodesTable,
  TruckTypesTable,
  WasteCodesTable,
} from "./components";

type Tab =
  | "entities"
  | "cities"
  | "disposal"
  | "service-types"
  | "truck-types"
  | "skills"
  | "waste"
  | "shifts";

const TABS: { id: Tab; label: string; count: (m: OpsMasters) => number }[] = [
  { id: "entities", label: "Entities", count: (m) => m.entities.length },
  { id: "cities", label: "Cities & depots", count: (m) => m.cities.length },
  {
    id: "disposal",
    label: "Disposal sites",
    count: (m) => m.disposalSites.length,
  },
  {
    id: "service-types",
    label: "Service types",
    count: (m) => m.serviceTypes.length,
  },
  {
    id: "truck-types",
    label: "Truck types",
    count: (m) => m.truckTypes.length,
  },
  { id: "skills", label: "Skill codes", count: (m) => m.skillCodes.length },
  { id: "waste", label: "Waste codes", count: (m) => m.wasteCodes.length },
  { id: "shifts", label: "Shifts", count: (m) => m.shifts.length },
];

export default function OpsLists() {
  const masters = useOpsMasters();
  const vehicles = useVehicles();
  const pros = useTechnicians();
  const [tab, setTab] = useState<Tab>("entities");

  const queries = [masters, vehicles, pros];
  const failed = queries.find((q) => q.isError);
  const m = masters.data;
  const empty = m && TABS.every((t) => t.count(m) === 0);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Settings" },
          { label: "Lookups" },
        ]}
        title="Lookups"
        description="Admin-maintained lookups the route rules compare against. Codes are what rules match; names are for screens."
      />

      {queries.some((q) => q.isPending) ? (
        <output
          className="block space-y-4"
          aria-busy
          aria-label="Loading operations lists"
        >
          <Skeleton className="h-8 w-full max-w-3xl" />
          <Skeleton className="h-96 w-full" />
        </output>
      ) : failed ? (
        <ErrorState
          error={failed.error}
          onRetry={() => {
            for (const q of queries) q.refetch();
          }}
        />
      ) : !m || empty ? (
        <EmptyState
          icon={ListTree}
          title="No operations lists yet"
          description="Entities, truck types, skill codes and the rest appear here once the admin backend seeds them."
        />
      ) : (
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList variant="line">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
                <span className="font-mono text-[11px] tabular-nums opacity-70">
                  {t.count(m)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="entities" className="pt-4">
            <EntitiesTable
              masters={m}
              vehicles={vehicles.data ?? []}
              pros={pros.data ?? []}
            />
          </TabsContent>
          <TabsContent value="cities" className="pt-4">
            <CitiesTable masters={m} />
          </TabsContent>
          <TabsContent value="disposal" className="pt-4">
            <DisposalSitesTable masters={m} />
          </TabsContent>
          <TabsContent value="service-types" className="pt-4">
            <ServiceTypesTable masters={m} />
          </TabsContent>
          <TabsContent value="truck-types" className="pt-4">
            <TruckTypesTable masters={m} vehicles={vehicles.data ?? []} />
          </TabsContent>
          <TabsContent value="skills" className="pt-4">
            <SkillCodesTable masters={m} pros={pros.data ?? []} />
          </TabsContent>
          <TabsContent value="waste" className="pt-4">
            <WasteCodesTable masters={m} />
          </TabsContent>
          <TabsContent value="shifts" className="pt-4">
            <ShiftsTable masters={m} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
