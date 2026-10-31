"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { cn } from "cn";
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import { type ReactNode, useMemo, useRef } from "react";

/**
 * Searchable select built on Base UI Combobox: the replacement for
 * `NativeSelect`. Options are plain `{ value, label }` records; values are
 * strings and `""` means "nothing selected", so it drops into state that
 * used to hold a `<select>` value.
 */
export type ComboboxOption = {
  value: string;
  label: string;
  /** Secondary line under the label (address, code, owner…). */
  description?: string;
  /** Leading visual: an icon, avatar or `StreamTag` swatch. */
  icon?: ReactNode;
  /** Options sharing a group render under one heading, in first-seen order. */
  group?: string;
  disabled?: boolean;
};

type Size = "sm" | "default";

type SharedProps = {
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  size?: Size;
  disabled?: boolean;
  /** Goes on the trigger, so a `<Label htmlFor>` focuses it. */
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

const triggerBase =
  "group/combobox-trigger relative flex w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-card text-left text-sm shadow-xs transition-colors outline-none hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 data-popup-open:border-ring data-popup-open:ring-2 data-popup-open:ring-ring/25 dark:bg-input/30";

const triggerSize: Record<Size, string> = {
  default: "min-h-10 px-3 py-1.5",
  sm: "min-h-9 px-2.5 py-1",
};

/** Groups options by `group`, keeping first-seen order. */
function toGroups(options: ComboboxOption[]) {
  const groups = new Map<string, string[]>();
  for (const option of options) {
    const key = option.group ?? "";
    const bucket = groups.get(key);
    if (bucket) bucket.push(option.value);
    else groups.set(key, [option.value]);
  }
  return [...groups].map(([value, items]) => ({ value, items }));
}

function useOptionIndex(options: ComboboxOption[]) {
  return useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value, o]));
    const grouped = options.some((o) => o.group);
    return {
      byValue,
      items: grouped ? toGroups(options) : options.map((o) => o.value),
      grouped,
      label: (value: string) => byValue.get(value)?.label ?? "",
    };
  }, [options]);
}

function Popup({
  children,
  anchor,
}: {
  children: ReactNode;
  anchor?: React.RefObject<HTMLElement | null>;
}) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        sideOffset={6}
        align="start"
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className="group/combobox-content flex max-h-[min(24rem,var(--available-height))] w-(--anchor-width) min-w-56 max-w-(--available-width) origin-(--transform-origin) flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg duration-150 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-1 data-closed:animate-out data-closed:fade-out-0"
        >
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="border-b border-border p-2">
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <ComboboxPrimitive.Input
          placeholder={placeholder}
          className="h-9 w-full rounded-md bg-muted/60 pr-2.5 pl-8.5 text-sm outline-none placeholder:text-muted-foreground focus:bg-muted"
        />
      </div>
    </div>
  );
}

function OptionList({
  index,
  emptyText,
  multiple = false,
}: {
  index: ReturnType<typeof useOptionIndex>;
  emptyText: string;
  multiple?: boolean;
}) {
  const renderItem = (value: string) => {
    const option = index.byValue.get(value);
    if (!option) return null;
    return (
      <ComboboxPrimitive.Item
        key={value}
        value={value}
        disabled={option.disabled}
        className="group/combobox-item relative flex w-full cursor-default items-center gap-2.5 rounded-md py-2 pr-9 pl-2.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-muted data-selected:font-medium [&_svg]:shrink-0"
      >
        {multiple ? (
          <span
            aria-hidden
            className="flex size-4 items-center justify-center rounded-[4px] border border-input group-data-selected/combobox-item:border-primary group-data-selected/combobox-item:bg-primary group-data-selected/combobox-item:text-primary-foreground"
          >
            <CheckIcon className="hidden size-3 group-data-selected/combobox-item:block" />
          </span>
        ) : null}
        {option.icon ? (
          <span className="flex shrink-0 items-center">{option.icon}</span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block truncate">{option.label}</span>
          {option.description ? (
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {option.description}
            </span>
          ) : null}
        </span>
        {multiple ? null : (
          <ComboboxPrimitive.ItemIndicator className="absolute right-2.5 flex items-center text-primary">
            <CheckIcon className="size-4" />
          </ComboboxPrimitive.ItemIndicator>
        )}
      </ComboboxPrimitive.Item>
    );
  };

  return (
    <>
      <ComboboxPrimitive.Empty className="hidden px-3 py-6 text-center text-sm text-muted-foreground group-data-empty/combobox-content:block">
        {emptyText}
      </ComboboxPrimitive.Empty>
      <ComboboxPrimitive.List className="scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0">
        {index.grouped
          ? (group: { value: string; items: string[] }) => (
              <ComboboxPrimitive.Group
                key={group.value}
                items={group.items}
                className="not-first:mt-1 not-first:border-t not-first:border-border not-first:pt-1"
              >
                {group.value ? (
                  <ComboboxPrimitive.GroupLabel className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {group.value}
                  </ComboboxPrimitive.GroupLabel>
                ) : null}
                <ComboboxPrimitive.Collection>
                  {(value: string) => renderItem(value)}
                </ComboboxPrimitive.Collection>
              </ComboboxPrimitive.Group>
            )
          : (value: string) => renderItem(value)}
      </ComboboxPrimitive.List>
    </>
  );
}

type ComboboxProps = SharedProps & {
  value: string;
  onValueChange: (value: string) => void;
  /** Show an × that resets the value to `""`. */
  clearable?: boolean;
  /** Hide the search box: for short, fixed lists. Defaults to on past 6 options. */
  searchable?: boolean;
};

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches",
  size = "default",
  clearable = false,
  searchable,
  disabled,
  id,
  className,
  ...aria
}: ComboboxProps) {
  const index = useOptionIndex(options);
  const showSearch = searchable ?? options.length > 6;
  const selected = value ? index.byValue.get(value) : undefined;

  return (
    <ComboboxPrimitive.Root
      items={index.items}
      value={value || null}
      onValueChange={(next) => onValueChange((next as string | null) ?? "")}
      itemToStringLabel={index.label}
      disabled={disabled}
    >
      <div className={cn("relative w-full", className)}>
        <ComboboxPrimitive.Trigger
          id={id}
          data-slot="combobox-trigger"
          className={cn(
            triggerBase,
            triggerSize[size],
            clearable && selected ? "pr-14" : "pr-9",
          )}
          {...aria}
        >
          {selected?.icon ? (
            <span className="flex shrink-0 items-center">{selected.icon}</span>
          ) : null}
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !selected && "text-muted-foreground",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronDownIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground transition-transform group-data-popup-open/combobox-trigger:rotate-180"
          />
        </ComboboxPrimitive.Trigger>
        {clearable && selected && !disabled ? (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => onValueChange("")}
            className="absolute top-1/2 right-8 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>
      <Popup>
        {showSearch ? <SearchInput placeholder={searchPlaceholder} /> : null}
        <OptionList index={index} emptyText={emptyText} />
      </Popup>
    </ComboboxPrimitive.Root>
  );
}

type MultiComboboxProps = SharedProps & {
  value: string[];
  onValueChange: (value: string[]) => void;
};

/** Multi-select: chips in the field, type to filter, checkboxes in the list. */
export function MultiCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  emptyText = "No matches",
  size = "default",
  disabled,
  id,
  className,
  ...aria
}: MultiComboboxProps) {
  const index = useOptionIndex(options);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  return (
    <ComboboxPrimitive.Root
      multiple
      items={index.items}
      value={value}
      onValueChange={(next) => onValueChange(next as string[])}
      itemToStringLabel={index.label}
      disabled={disabled}
    >
      <ComboboxPrimitive.Chips
        ref={anchorRef}
        className={cn(
          triggerBase,
          triggerSize[size],
          "flex-wrap gap-1.5 pr-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25",
          value.length > 0 && "pl-1.5",
          className,
        )}
      >
        <ComboboxPrimitive.Value>
          {(selected: string[]) =>
            selected.map((v) => (
              <ComboboxPrimitive.Chip
                key={v}
                className="flex h-6 items-center gap-1 rounded-md bg-muted pr-1 pl-2 text-xs font-medium text-foreground outline-none data-highlighted:ring-2 data-highlighted:ring-ring/30"
              >
                {index.label(v)}
                <ComboboxPrimitive.ChipRemove
                  aria-label={`Remove ${index.label(v)}`}
                  className="flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </ComboboxPrimitive.ChipRemove>
              </ComboboxPrimitive.Chip>
            ))
          }
        </ComboboxPrimitive.Value>
        <ComboboxPrimitive.Input
          id={id}
          placeholder={value.length ? "" : placeholder}
          className="h-6 w-0 min-w-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          {...aria}
        />
      </ComboboxPrimitive.Chips>
      <Popup anchor={anchorRef}>
        <OptionList index={index} emptyText={emptyText} multiple />
      </Popup>
    </ComboboxPrimitive.Root>
  );
}
