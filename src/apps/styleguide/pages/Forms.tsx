"use client";

import { Search } from "lucide-react";
import { useId } from "react";
import { WASTE_STREAMS } from "@/components/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Code, Demo, SectionHeader } from "../components";

export default function FormsPage() {
  const id = useId();
  const f = (name: string) => `${id}-${name}`;

  return (
    <div className="space-y-5">
      <SectionHeader
        number="06"
        title="Inputs & forms"
        description={
          <>
            Height 32px (40px on mobile screens), 1px <Code>--input</Code>{" "}
            border, transparent fill; focus swaps the border to{" "}
            <Code>--ring</Code> with a 3px 50% ring.
          </>
        }
      />
      <Demo className="grid grid-cols-3 gap-x-6 gap-y-5 p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={f("company")} className="text-[13px]">
            Company name
          </Label>
          <Input id={f("company")} defaultValue="Al Shwaib Trading LLC" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={f("focused")} className="text-[13px]">
            Focused
          </Label>
          <Input
            id={f("focused")}
            defaultValue="Dubai Marina, Tower 4"
            className="border-ring ring-ring/50 ring-3"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={f("phone")} className="text-[13px]">
            Invalid
          </Label>
          <Input
            id={f("phone")}
            defaultValue="+971 5"
            aria-invalid
            aria-describedby={f("phone-help")}
          />
          <span id={f("phone-help")} className="text-destructive text-xs">
            Enter a full UAE number, e.g. +971 50 226 4150
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={f("search")} className="text-[13px]">
            Search
          </Label>
          <span className="relative flex">
            <Search
              className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-[15px] -translate-y-1/2"
              aria-hidden
            />
            <Input
              id={f("search")}
              type="search"
              placeholder="Search clients, quotes, invoices…"
              className="ps-8"
            />
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={f("stream")} className="text-[13px]">
            Waste stream
          </Label>
          <NativeSelect id={f("stream")} defaultValue="recyclable">
            {WASTE_STREAMS.map((s) => (
              <NativeSelectOption key={s.id} value={s.id}>
                {s.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={f("disabled")} className="text-[13px]">
            Disabled
          </Label>
          <Input
            id={f("disabled")}
            disabled
            defaultValue="Auto-assigned by zone"
          />
        </div>

        <fieldset className="flex flex-col gap-2.5 text-[13px]">
          <legend className="mb-2.5 font-medium">Frequency</legend>
          <RadioGroup defaultValue="daily" className="gap-2.5">
            {[
              ["daily", "Daily"],
              ["twice", "Twice weekly"],
              ["request", "On request"],
            ].map(([value, label]) => (
              <div key={value} className="flex items-center gap-2.5">
                <RadioGroupItem value={value} id={f(`freq-${value}`)} />
                <Label htmlFor={f(`freq-${value}`)} className="font-normal">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>

        <fieldset className="flex flex-col gap-2.5 text-[13px]">
          <legend className="mb-2.5 font-medium">Compliance</legend>
          {[
            ["licence", "Trade licence attached", true],
            ["permit", "Dubai Municipality permit", false],
            ["manifest", "Medical waste manifest", false],
          ].map(([value, label, checked]) => (
            <div key={String(value)} className="flex items-center gap-2.5">
              <Checkbox
                id={f(`comp-${value}`)}
                defaultChecked={Boolean(checked)}
              />
              <Label htmlFor={f(`comp-${value}`)} className="font-normal">
                {label}
              </Label>
            </div>
          ))}
        </fieldset>

        <div className="flex flex-col gap-3 text-[13px]">
          <div className="font-medium">Switches</div>
          <div className="flex items-center justify-between gap-2.5">
            <Label htmlFor={f("tracking")} className="font-normal">
              Live tracking dashboard
            </Label>
            <Switch id={f("tracking")} defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-2.5">
            <Label htmlFor={f("report")} className="font-normal">
              Monthly PDF report
            </Label>
            <Switch id={f("report")} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={f("intl-phone")} className="text-[13px]">
            Phone number
          </Label>
          <PhoneInput
            id={f("intl-phone")}
            placeholder="50 226 4150"
            initialCountry="ae"
          />
          <span className="text-muted-foreground text-xs">
            <Code>PhoneInput</Code> — intl-tel-input, emits E.164
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={f("intl-phone-invalid")} className="text-[13px]">
            Phone number, invalid
          </Label>
          <PhoneInput
            id={f("intl-phone-invalid")}
            value="+9715"
            invalid
            initialCountry="ae"
          />
          <span className="text-destructive text-xs">
            Enter a full number for the selected country
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={f("intl-phone-disabled")} className="text-[13px]">
            Phone number, disabled
          </Label>
          <PhoneInput
            id={f("intl-phone-disabled")}
            value="+971502264150"
            disabled
            initialCountry="ae"
          />
        </div>

        <div className="col-span-3 flex flex-col gap-1.5">
          <Label htmlFor={f("note")} className="text-[13px]">
            Internal note
          </Label>
          <Textarea
            id={f("note")}
            placeholder="Visible to staff only…"
            className="min-h-20"
          />
        </div>
      </Demo>
    </div>
  );
}
