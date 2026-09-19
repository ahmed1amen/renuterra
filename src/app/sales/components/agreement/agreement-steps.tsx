"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { StatusPill, StreamTag, WASTE_STREAMS } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Lead } from "@/mocks";
import { formatCurrency } from "../../utils";
import { LEAD_STATUS } from "../lead-meta";
import {
  type AgreementDraft,
  agreementMonthly,
  agreementValue,
  BILLING_CYCLES,
  COLLECTION_WINDOWS,
  CONTAINERS,
  FREQUENCIES,
  findContainer,
  findFrequency,
  lineMonthly,
  newLine,
  SERVICE_ZONES,
  TERM_OPTIONS,
  WEEKDAYS,
} from "./agreement";

type StepProps = {
  draft: AgreementDraft;
  update: (patch: Partial<AgreementDraft>) => void;
};

/** Pick the lead this agreement came from, or type a customer in by hand. */
export function CustomerStep({
  draft,
  update,
  leads,
}: StepProps & { leads: Lead[] }) {
  const id = useId();

  const pick = (lead: Lead) =>
    update({
      customer: {
        leadId: lead.id,
        company: lead.company,
        contactName: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
      },
    });

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Start from a lead</h3>
        <ul className="grid max-h-44 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {leads.slice(0, 8).map((lead) => {
            const selected = draft.customer.leadId === lead.id;
            const status = LEAD_STATUS[lead.status];
            return (
              <li key={lead.id}>
                <button
                  type="button"
                  onClick={() => pick(lead)}
                  aria-pressed={selected}
                  className={cn(
                    "w-full rounded-lg border p-2.5 text-left transition-colors",
                    selected
                      ? "border-primary bg-accent/60"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium">
                      {lead.company}
                    </span>
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {lead.firstName} {lead.lastName} · {lead.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Field label="Company" htmlFor={`${id}-company`}>
          <Input
            id={`${id}-company`}
            value={draft.customer.company}
            onChange={(e) =>
              update({
                customer: { ...draft.customer, company: e.target.value },
              })
            }
            placeholder="Brightline Solar"
          />
        </Field>
        <Field label="Contact" htmlFor={`${id}-contact`}>
          <Input
            id={`${id}-contact`}
            value={draft.customer.contactName}
            onChange={(e) =>
              update({
                customer: { ...draft.customer, contactName: e.target.value },
              })
            }
            placeholder="Hannah Whitfield"
          />
        </Field>
        <Field label="Email" htmlFor={`${id}-email`}>
          <Input
            id={`${id}-email`}
            type="email"
            value={draft.customer.email}
            onChange={(e) =>
              update({ customer: { ...draft.customer, email: e.target.value } })
            }
            placeholder="hannah@brightlinesolar.com"
          />
        </Field>
        <Field label="Phone" htmlFor={`${id}-phone`}>
          <Input
            id={`${id}-phone`}
            value={draft.customer.phone}
            onChange={(e) =>
              update({ customer: { ...draft.customer, phone: e.target.value } })
            }
            placeholder="+971 50 555 0100"
          />
        </Field>
      </section>
    </div>
  );
}

/** Where the crew actually goes — the service point this agreement covers. */
export function SiteStep({ draft, update }: StepProps) {
  const id = useId();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Site name" htmlFor={`${id}-name`}>
        <Input
          id={`${id}-name`}
          value={draft.site.name}
          onChange={(e) =>
            update({ site: { ...draft.site, name: e.target.value } })
          }
          placeholder="Warehouse 4"
        />
      </Field>
      <Field label="Service zone" htmlFor={`${id}-zone`}>
        <NativeSelect
          id={`${id}-zone`}
          value={draft.site.zone}
          onChange={(e) =>
            update({ site: { ...draft.site, zone: e.target.value } })
          }
        >
          {SERVICE_ZONES.map((zone) => (
            <NativeSelectOption key={zone} value={zone}>
              {zone}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field
        label="Address"
        htmlFor={`${id}-address`}
        className="sm:col-span-2"
      >
        <Input
          id={`${id}-address`}
          value={draft.site.address}
          onChange={(e) =>
            update({ site: { ...draft.site, address: e.target.value } })
          }
          placeholder="Al Quoz Industrial 3, Dubai"
        />
      </Field>
      <Field
        label="Access notes"
        htmlFor={`${id}-notes`}
        className="sm:col-span-2"
        hint="Gate codes, dock restrictions, anything the driver needs."
      >
        <Textarea
          id={`${id}-notes`}
          rows={3}
          value={draft.site.accessNotes}
          onChange={(e) =>
            update({ site: { ...draft.site, accessNotes: e.target.value } })
          }
          placeholder="Bay 2, badge required at the security gate."
        />
      </Field>
    </div>
  );
}

/** The heart of a waste agreement: a line per stream we collect. */
export function ServicesStep({ draft, update }: StepProps) {
  const setLine = (
    lineId: string,
    patch: Partial<AgreementDraft["lines"][0]>,
  ) =>
    update({
      lines: draft.lines.map((line) =>
        line.id === lineId ? { ...line, ...patch } : line,
      ),
    });

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {draft.lines.map((line) => (
          <li
            key={line.id}
            className="border-border space-y-3 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <StreamTag stream={line.stream} />
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(lineMonthly(line))}
                  <span className="text-muted-foreground font-sans text-xs font-normal">
                    /mo
                  </span>
                </span>
                {draft.lines.length > 1 ? (
                  <button
                    type="button"
                    aria-label="Remove line"
                    onClick={() =>
                      update({
                        lines: draft.lines.filter((l) => l.id !== line.id),
                      })
                    }
                    className="text-muted-foreground hover:bg-muted hover:text-destructive flex size-7 items-center justify-center rounded-md transition-colors"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              <LineField label="Stream">
                <NativeSelect
                  value={line.stream}
                  aria-label="Waste stream"
                  onChange={(e) =>
                    setLine(line.id, {
                      stream: e.target.value as typeof line.stream,
                    })
                  }
                >
                  {WASTE_STREAMS.map((stream) => (
                    <NativeSelectOption key={stream.id} value={stream.id}>
                      {stream.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </LineField>

              <LineField label="Container">
                <NativeSelect
                  value={line.containerId}
                  aria-label="Container"
                  onChange={(e) =>
                    setLine(line.id, { containerId: e.target.value })
                  }
                >
                  {CONTAINERS.map((container) => (
                    <NativeSelectOption key={container.id} value={container.id}>
                      {container.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </LineField>

              <LineField label="Qty">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  aria-label="Quantity"
                  value={line.quantity}
                  onChange={(e) =>
                    setLine(line.id, {
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </LineField>

              <LineField label="Frequency">
                <NativeSelect
                  value={line.frequencyId}
                  aria-label="Collection frequency"
                  onChange={(e) =>
                    setLine(line.id, { frequencyId: e.target.value })
                  }
                >
                  {FREQUENCIES.map((frequency) => (
                    <NativeSelectOption key={frequency.id} value={frequency.id}>
                      {frequency.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </LineField>
            </div>

            <p className="text-muted-foreground text-xs">
              {line.quantity} × {findContainer(line.containerId).label} ·{" "}
              {findFrequency(line.frequencyId).label} ·{" "}
              {formatCurrency(findContainer(line.containerId).rental)} rental +{" "}
              {formatCurrency(findContainer(line.containerId).lift)} a lift
            </p>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => update({ lines: [...draft.lines, newLine()] })}
        >
          <Plus data-icon="inline-start" />
          Add a stream
        </Button>
        <p className="text-sm">
          <span className="text-muted-foreground">Monthly</span>{" "}
          <span className="font-mono font-semibold tabular-nums">
            {formatCurrency(agreementMonthly(draft.lines))}
          </span>
        </p>
      </div>
    </div>
  );
}

export function ScheduleStep({ draft, update }: StepProps) {
  const id = useId();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="First collection" htmlFor={`${id}-start`}>
        <Input
          id={`${id}-start`}
          type="date"
          value={draft.schedule.startDate}
          onChange={(e) =>
            update({
              schedule: { ...draft.schedule, startDate: e.target.value },
            })
          }
        />
      </Field>
      <Field label="Preferred day" htmlFor={`${id}-day`}>
        <NativeSelect
          id={`${id}-day`}
          value={String(draft.schedule.preferredDay)}
          onChange={(e) =>
            update({
              schedule: {
                ...draft.schedule,
                preferredDay: Number(e.target.value),
              },
            })
          }
        >
          {WEEKDAYS.map((day, index) => (
            <NativeSelectOption key={day} value={String(index)}>
              {day}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field
        label="Arrival window"
        htmlFor={`${id}-window`}
        className="sm:col-span-2"
        hint="What the customer is told to expect; dispatch can still move it."
      >
        <NativeSelect
          id={`${id}-window`}
          value={draft.schedule.window}
          onChange={(e) =>
            update({ schedule: { ...draft.schedule, window: e.target.value } })
          }
        >
          {COLLECTION_WINDOWS.map((window) => (
            <NativeSelectOption key={window} value={window}>
              {window}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
    </div>
  );
}

export function TermsStep({ draft, update }: StepProps) {
  const id = useId();

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Term</legend>
        <div className="flex flex-wrap gap-2">
          {TERM_OPTIONS.map((months) => {
            const selected = draft.terms.termMonths === months;
            return (
              <button
                key={months}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  update({ terms: { ...draft.terms, termMonths: months } })
                }
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted",
                )}
              >
                {months} months
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Billing cycle" htmlFor={`${id}-billing`}>
          <NativeSelect
            id={`${id}-billing`}
            value={draft.terms.billing}
            onChange={(e) =>
              update({
                terms: {
                  ...draft.terms,
                  billing: e.target.value as typeof draft.terms.billing,
                },
              })
            }
          >
            {BILLING_CYCLES.map((cycle) => (
              <NativeSelectOption key={cycle.id} value={cycle.id}>
                {cycle.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="PO number" htmlFor={`${id}-po`} hint="Optional.">
          <Input
            id={`${id}-po`}
            value={draft.terms.poNumber}
            onChange={(e) =>
              update({ terms: { ...draft.terms, poNumber: e.target.value } })
            }
            placeholder="PO-2026-0148"
          />
        </Field>
      </div>

      <dl className="bg-muted/50 grid gap-2 rounded-lg p-3 text-sm sm:grid-cols-3">
        <Summary
          label="Monthly"
          value={formatCurrency(agreementMonthly(draft.lines))}
        />
        <Summary label="Term" value={`${draft.terms.termMonths} months`} />
        <Summary
          label="Contract value"
          value={formatCurrency(agreementValue(draft))}
        />
      </dl>
    </div>
  );
}

export function ReviewStep({ draft }: { draft: AgreementDraft }) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Detail label="Customer" value={draft.customer.company || "—"} />
        <Detail label="Contact" value={draft.customer.contactName || "—"} />
        <Detail
          label="Site"
          value={
            draft.site.name ? `${draft.site.name} · ${draft.site.zone}` : "—"
          }
        />
        <Detail label="Address" value={draft.site.address || "—"} />
        <Detail
          label="Starts"
          value={draft.schedule.startDate || "—"}
          hint={`${WEEKDAYS[draft.schedule.preferredDay]}s, ${draft.schedule.window}`}
        />
        <Detail
          label="Billing"
          value={
            BILLING_CYCLES.find((c) => c.id === draft.terms.billing)?.label ??
            "—"
          }
          hint={draft.terms.poNumber ? `PO ${draft.terms.poNumber}` : undefined}
        />
      </dl>

      <section className="border-border rounded-lg border">
        <h3 className="border-border border-b px-3 py-2 text-sm font-semibold">
          Services
        </h3>
        <ul className="divide-border/60 divide-y">
          {draft.lines.map((line) => (
            <li
              key={line.id}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span className="min-w-0">
                <StreamTag stream={line.stream} />
                <span className="text-muted-foreground mt-1 block text-xs">
                  {line.quantity} × {findContainer(line.containerId).label} ·{" "}
                  {findFrequency(line.frequencyId).label}
                </span>
              </span>
              <span className="shrink-0 font-mono text-sm tabular-nums">
                {formatCurrency(lineMonthly(line))}
                <span className="text-muted-foreground font-sans text-xs">
                  /mo
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className="border-border flex items-center justify-between border-t px-3 py-2">
          <span className="text-sm font-medium">
            {draft.terms.termMonths}-month contract value
          </span>
          <span className="font-mono text-base font-bold tabular-nums">
            {formatCurrency(agreementValue(draft))}
          </span>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

function LineField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
      {children}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-mono text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Detail({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
      {hint ? <dd className="text-muted-foreground text-xs">{hint}</dd> : null}
    </div>
  );
}
