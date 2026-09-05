"use client";

import { cn } from "cn";
import type { AllOptions } from "intl-tel-input";
import IntlTelInput, {
  type IntlTelInputRef,
} from "intl-tel-input/reactWithUtils";
import { useRef } from "react";
import "intl-tel-input/styles";

type PhoneInputProps = {
  id?: string;
  name?: string;
  /** Full number, ideally E.164 ("+971502264150"). */
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** ISO 3166-1 alpha-2 for the initial flag. */
  initialCountry?: AllOptions["initialCountry"];
  className?: string;
  /** Fires with the E.164 number on every change. */
  onChange?: (number: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  onCountryChange?: (iso2: string) => void;
};

/**
 * International phone input on intl-tel-input's React component, skinned to
 * match `Input`. Emits E.164 via `onChange`; validation comes bundled (utils
 * build). Theme overrides for the flag dropdown live in `globals.css` (.iti).
 */
function PhoneInput({
  id,
  name,
  value,
  placeholder,
  disabled,
  invalid,
  initialCountry = "ae",
  className,
  onChange,
  onValidityChange,
  onCountryChange,
}: PhoneInputProps) {
  const ref = useRef<IntlTelInputRef>(null);

  return (
    <span className={cn("phone-input flex w-full min-w-0", className)}>
      <IntlTelInput
        ref={ref}
        value={value}
        disabled={disabled}
        initialCountry={initialCountry}
        countrySearch
        formatAsYouType
        nationalMode
        onChangeNumber={onChange}
        onChangeValidity={onValidityChange}
        onChangeCountry={onCountryChange}
        inputProps={{
          id,
          name,
          placeholder,
          type: "tel",
          "aria-invalid": invalid || undefined,
          className:
            "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pe-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        }}
      />
    </span>
  );
}

export { PhoneInput, type IntlTelInputRef };
