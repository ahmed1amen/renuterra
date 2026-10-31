import { Info } from "lucide-react";
import { StatusPill, StreamTag } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  CapacityBasis,
  DisposalSite,
  OpsMasters,
  Technician,
  Vehicle,
} from "@/mocks";
import { Chips, CodeChip, LookupCard } from "./lookup-card";

const CAPACITY_BASIS: Record<CapacityBasis, string> = {
  volume: "Loose volume",
  visits: "Visits (lifts)",
  weight: "Weight & slots",
};

const SITE_KIND: Record<DisposalSite["kind"], string> = {
  landfill: "Landfill",
  transfer: "Transfer station",
  mrf: "MRF",
  organics: "Organics",
  cnd: "C&D facility",
  treatment: "Treatment facility",
  wastewater: "Wastewater plant",
};

const kg = new Intl.NumberFormat("en-US");

type Props = { masters: OpsMasters };

export function EntitiesTable({
  masters,
  vehicles,
  pros,
}: Props & { vehicles: Vehicle[]; pros: Technician[] }) {
  return (
    <LookupCard
      title="Entities"
      description="Operating companies. A route, truck or service line belongs to one; trucks with no entity are the shared pool."
      count={masters.entities.length}
      addLabel="Add entity"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Trucks</TableHead>
            <TableHead className="text-right">Service pros</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {masters.entities.map((e) => (
            <TableRow key={e.code}>
              <TableCell className="font-mono text-sm font-medium">
                {e.code}
              </TableCell>
              <TableCell className="text-sm">{e.name}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {vehicles.filter((v) => v.entity === e.code).length}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {pros.filter((p) => p.entity === e.code).length}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="text-muted-foreground font-mono text-sm">
              -
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              Shared pool (no entity)
            </TableCell>
            <TableCell className="text-right text-sm tabular-nums">
              {vehicles.filter((v) => v.entity === null).length}
            </TableCell>
            <TableCell className="text-muted-foreground text-right text-sm">
              -
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </LookupCard>
  );
}

export function CitiesTable({ masters }: Props) {
  return (
    <LookupCard
      title="Cities & depots"
      description="Every route runs in one city and starts from one of its depots."
      count={masters.cities.length}
      addLabel="Add city or depot"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Code</TableHead>
            <TableHead className="w-40">City</TableHead>
            <TableHead>Depots</TableHead>
            <TableHead className="text-right">Disposal sites</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {masters.cities.map((city) => {
            const depots = masters.depots.filter((d) => d.city === city.code);
            const sites = masters.disposalSites.filter(
              (s) => s.city === city.code,
            ).length;
            return (
              <TableRow key={city.code} className="align-top">
                <TableCell className="font-mono text-sm font-medium">
                  {city.code}
                </TableCell>
                <TableCell className="text-sm">{city.name}</TableCell>
                <TableCell className="text-sm">
                  {depots.length ? (
                    <ul className="space-y-1">
                      {depots.map((d) => (
                        <li key={d.id}>
                          {d.name}
                          <span className="text-muted-foreground ms-2 font-mono text-xs tabular-nums">
                            {d.lat.toFixed(3)}, {d.lng.toFixed(3)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">No depot</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {sites || <span className="text-muted-foreground">-</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </LookupCard>
  );
}

export function DisposalSitesTable({ masters }: Props) {
  return (
    <LookupCard
      title="Disposal sites"
      description="Where trucks tip. A route can only list sites in its city that accept every waste code it carries."
      count={masters.disposalSites.length}
      addLabel="Add disposal site"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Site</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Accepted waste codes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {masters.disposalSites.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="text-sm font-medium">{s.name}</TableCell>
              <TableCell className="text-sm">{SITE_KIND[s.kind]}</TableCell>
              <TableCell className="font-mono text-sm">{s.city}</TableCell>
              <TableCell>
                <Chips codes={s.wasteCodes} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LookupCard>
  );
}

export function ServiceTypesTable({ masters }: Props) {
  return (
    <LookupCard
      title="Service types"
      description="How a route collects. Decides the capacity basis, which truck types fit and which skills the driver needs."
      count={masters.serviceTypes.length}
      addLabel="Add service type"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Capacity basis</TableHead>
            <TableHead className="text-right">Default helpers</TableHead>
            <TableHead>Required skills</TableHead>
            <TableHead>Compatible truck types</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {masters.serviceTypes.map((st) => (
            <TableRow key={st.code}>
              <TableCell className="font-mono text-sm font-medium">
                {st.code}
              </TableCell>
              <TableCell className="text-sm">{st.name}</TableCell>
              <TableCell className="text-sm">
                {CAPACITY_BASIS[st.capacityBasis]}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {st.defaultHelpers}
              </TableCell>
              <TableCell>
                <Chips codes={st.requiredSkills} />
              </TableCell>
              <TableCell>
                <Chips
                  codes={masters.truckTypes
                    .filter((t) => t.serviceTypes.includes(st.code))
                    .map((t) => t.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LookupCard>
  );
}

export function TruckTypesTable({
  masters,
  vehicles,
}: Props & { vehicles: Vehicle[] }) {
  return (
    <LookupCard
      title="Truck types"
      description="What a route asks for. Compacting bodies hold body volume × compression of loose waste per trip; legal payload still caps it."
      count={masters.truckTypes.length}
      addLabel="Add truck type"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Capacity basis</TableHead>
            <TableHead>Body × compression</TableHead>
            <TableHead className="text-right">Payload</TableHead>
            <TableHead className="text-right">Slots</TableHead>
            <TableHead>Service types</TableHead>
            <TableHead className="text-right">In fleet</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {masters.truckTypes.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-mono text-sm font-medium">
                {t.id}
              </TableCell>
              <TableCell className="text-sm">{t.name}</TableCell>
              <TableCell className="text-sm">
                {CAPACITY_BASIS[t.capacityBasis]}
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {t.bodyM3 && (t.compressionRatio ?? 1) > 1 ? (
                  <>
                    {t.bodyM3} m³ × {t.compressionRatio} ={" "}
                    <span className="font-medium">
                      {t.bodyM3 * (t.compressionRatio ?? 1)} m³
                    </span>
                    <span className="text-muted-foreground"> loose / trip</span>
                  </>
                ) : t.bodyM3 ? (
                  `${t.bodyM3} m³`
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right text-sm whitespace-nowrap tabular-nums">
                {kg.format(t.payloadKg)} kg
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {t.containerSlots ?? (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Chips codes={t.serviceTypes} />
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {vehicles.filter((v) => v.truckTypeId === t.id).length}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LookupCard>
  );
}

export function SkillCodesTable({
  masters,
  pros,
}: Props & { pros: Technician[] }) {
  return (
    <LookupCard
      title="Skill codes"
      description="What a driver must hold for a route. Expiry-tracked skills stop counting the day they lapse."
      count={masters.skillCodes.length}
      addLabel="Add skill code"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Code</TableHead>
            <TableHead>Skill</TableHead>
            <TableHead>Evidence on file</TableHead>
            <TableHead>Expiry tracked</TableHead>
            <TableHead className="text-right">Service pros</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {masters.skillCodes.map((s) => (
            <TableRow key={s.code}>
              <TableCell className="font-mono text-sm font-medium">
                {s.code}
              </TableCell>
              <TableCell className="text-sm">{s.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {s.evidence}
              </TableCell>
              <TableCell>
                {s.expiryTracked ? (
                  <StatusPill tone="info">Yes</StatusPill>
                ) : (
                  <span className="text-muted-foreground text-sm">No</span>
                )}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {
                  pros.filter((p) =>
                    p.skillCodes?.some((c) => c.code === s.code),
                  ).length
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LookupCard>
  );
}

export function WasteCodesTable({ masters }: Props) {
  return (
    <LookupCard
      title="Waste codes"
      description="What a route accepts. The group is the stream colour and ESG bucket; co-collect rules decide which codes may share a truck body."
      count={masters.wasteCodes.length}
      addLabel="Add waste code"
      note={
        <Alert>
          <Info aria-hidden />
          <AlertDescription>
            Hazardous and medical never share a route: not with each other, and
            not with any other stream.
          </AlertDescription>
        </Alert>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Can co-collect with</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {masters.wasteCodes.map((w) => (
            <TableRow key={w.code}>
              <TableCell className="font-mono text-sm font-medium">
                {w.code}
              </TableCell>
              <TableCell className="text-sm">{w.name}</TableCell>
              <TableCell>
                <StreamTag stream={w.group} />
              </TableCell>
              <TableCell>
                <Chips codes={w.coCollectWith} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LookupCard>
  );
}

export function ShiftsTable({ masters }: Props) {
  return (
    <LookupCard
      title="Shifts"
      description="Every route runs in exactly one shift. A driver's default schedule must allow it."
      count={masters.shifts.length}
      addLabel="Add shift"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Window</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {masters.shifts.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <CodeChip>{s.id}</CodeChip>
              </TableCell>
              <TableCell className="text-sm">{s.name}</TableCell>
              <TableCell className="font-mono text-sm tabular-nums">
                {s.startTime}–{s.endTime}
                {s.endTime < s.startTime ? (
                  <span className="text-muted-foreground ms-2 font-sans text-xs">
                    runs past midnight
                  </span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LookupCard>
  );
}
