"use client";

import { Check, ChevronLeft, ChevronRight, FileSignature } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLeads } from "@/features/crm";
import { cn } from "@/lib/utils";
import { MOCK_NOW } from "@/mocks";
import { useAgreementModal } from "@/stores/agreement-modal";
import { formatCurrency } from "../../utils";
import {
  AGREEMENT_STEPS,
  type AgreementDraft,
  agreementMonthly,
  emptyDraft,
  isStepComplete,
} from "./agreement";
import {
  CustomerStep,
  ReviewStep,
  ScheduleStep,
  ServicesStep,
  SiteStep,
  TermsStep,
} from "./agreement-steps";

/**
 * The new-agreement wizard: customer, site, services, schedule, terms, review.
 * Mirrors the sales flow it is modelled on, but in our language — an agreement
 * here is a waste service contract for one site, priced per stream.
 *
 * Prototype-grade throughout: the draft lives in component state, nothing is
 * validated beyond "has this step got enough to move on", and finishing fires
 * a toast instead of writing anything.
 */
export function AgreementModal() {
  const { open, leadId, close } = useAgreementModal();

  // Remounting on open gives every agreement a clean draft for free.
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      {open ? <AgreementWizard leadId={leadId} onDone={close} /> : null}
    </Dialog>
  );
}

function AgreementWizard({
  leadId,
  onDone,
}: {
  leadId?: string;
  onDone: () => void;
}) {
  const leads = useLeads();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<AgreementDraft>(() => {
    const base = emptyDraft(MOCK_NOW.slice(0, 10));
    const lead = (leads.data ?? []).find((l) => l.id === leadId);
    if (!lead) return base;
    return {
      ...base,
      customer: {
        leadId: lead.id,
        company: lead.company,
        contactName: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
      },
    };
  });

  const update = (patch: Partial<AgreementDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const step = AGREEMENT_STEPS[stepIndex];
  const isLast = stepIndex === AGREEMENT_STEPS.length - 1;
  const canAdvance = isStepComplete(step.id, draft);

  const finish = () => {
    toast.success("Agreement sent for signature", {
      description: `${draft.customer.company || "Customer"} · ${formatCurrency(
        agreementMonthly(draft.lines),
      )}/mo — prototype only.`,
    });
    onDone();
  };

  return (
    <DialogContent className="max-h-[90dvh] max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
      <DialogHeader className="border-border border-b p-4">
        <DialogTitle className="flex items-center gap-2">
          <FileSignature className="text-muted-foreground size-4" aria-hidden />
          New agreement
        </DialogTitle>
        <DialogDescription>
          A waste service contract for one site, priced per stream.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-col sm:flex-row">
        {/* Step rail — every step is reachable; completion is advisory. */}
        <nav
          aria-label="Agreement steps"
          className="border-border bg-muted/30 shrink-0 border-b p-3 sm:w-44 sm:border-r sm:border-b-0"
        >
          <ol className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
            {AGREEMENT_STEPS.map((entry, index) => {
              const active = index === stepIndex;
              const done = index < stepIndex && isStepComplete(entry.id, draft);
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setStepIndex(index)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium whitespace-nowrap transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                        active
                          ? "bg-primary-foreground/20"
                          : done
                            ? "bg-success-bg text-success"
                            : "bg-muted-foreground/15",
                      )}
                    >
                      {done ? (
                        <Check className="size-3" aria-hidden />
                      ) : (
                        index + 1
                      )}
                    </span>
                    {entry.title}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {step.id === "customer" ? (
            <CustomerStep
              draft={draft}
              update={update}
              leads={leads.data ?? []}
            />
          ) : null}
          {step.id === "site" ? (
            <SiteStep draft={draft} update={update} />
          ) : null}
          {step.id === "services" ? (
            <ServicesStep draft={draft} update={update} />
          ) : null}
          {step.id === "schedule" ? (
            <ScheduleStep draft={draft} update={update} />
          ) : null}
          {step.id === "terms" ? (
            <TermsStep draft={draft} update={update} />
          ) : null}
          {step.id === "review" ? <ReviewStep draft={draft} /> : null}
        </div>
      </div>

      <footer className="border-border flex items-center justify-between gap-3 border-t p-3">
        <p className="text-muted-foreground text-xs">
          Step {stepIndex + 1} of {AGREEMENT_STEPS.length}
          <span className="mx-1.5">·</span>
          <span className="font-mono tabular-nums">
            {formatCurrency(agreementMonthly(draft.lines))}
          </span>{" "}
          a month
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex(stepIndex - 1)}
          >
            <ChevronLeft data-icon="inline-start" />
            Back
          </Button>
          {isLast ? (
            <Button size="sm" onClick={finish}>
              <FileSignature data-icon="inline-start" />
              Send for signature
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!canAdvance}
              onClick={() => setStepIndex(stepIndex + 1)}
            >
              Next
              <ChevronRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      </footer>
    </DialogContent>
  );
}
