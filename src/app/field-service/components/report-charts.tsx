"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Small, single-hue charts for the Performance tab and Reports. One colour
 * (the brand series, `chart-1`) carries the measured value; targets and
 * capacity are neutral marks, so nothing relies on telling two hues apart.
 * Every chart names the hovered mark above the plot and has a table view.
 */

export type BulletRow = {
  key: string;
  label: string;
  /** Measured value (solid bar). */
  actual: number;
  /** Target (neutral tick). */
  planned: number;
  /** Extra context for the hover line, e.g. "7 runs". */
  note?: string;
};

/**
 * Actual as a column, planned as a tick across it, capacity (100%) as a
 * dashed line. Reads as "did we carry what we planned, and how full".
 */
export function BulletColumns({
  rows,
  unit = "%",
  actualLabel = "Actual",
  plannedLabel = "Planned",
  height = 160,
}: {
  rows: BulletRow[];
  unit?: string;
  actualLabel?: string;
  plannedLabel?: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(100, ...rows.map((r) => Math.max(r.actual, r.planned)));
  const y = (v: number) => (v / max) * 100;
  const shown = hover === null ? rows.length - 1 : hover;
  const focus = rows[shown];

  return (
    <figure className="space-y-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {focus ? (
            <>
              <span className="text-foreground font-medium">{focus.label}</span>
              {": "}
              {actualLabel.toLowerCase()}{" "}
              <span className="text-foreground font-mono tabular-nums">
                {focus.actual}
                {unit}
              </span>
              {", "}
              {plannedLabel.toLowerCase()}{" "}
              <span className="text-foreground font-mono tabular-nums">
                {focus.planned}
                {unit}
              </span>
              {focus.note ? ` · ${focus.note}` : ""}
            </>
          ) : (
            "No data"
          )}
        </span>
        <span className="text-muted-foreground flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="bg-chart-1 inline-block size-2.5 rounded-sm" />
            {actualLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-foreground/70 inline-block h-0.5 w-3" />
            {plannedLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="border-muted-foreground inline-block w-3 border-t border-dashed" />
            Capacity
          </span>
        </span>
      </figcaption>

      <div className="relative border-b" style={{ height }}>
        <span
          aria-hidden
          className="border-muted-foreground/50 absolute inset-x-0 border-t border-dashed"
          style={{ bottom: `${y(100)}%` }}
        />
        <div className="absolute inset-0 flex items-end gap-1.5">
          {rows.map((r, i) => (
            <button
              key={r.key}
              type="button"
              aria-label={`${r.label}: ${actualLabel} ${r.actual}${unit}, ${plannedLabel} ${r.planned}${unit}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onBlur={() => setHover(null)}
              className={cn(
                "group relative h-full min-w-0 flex-1 rounded-t outline-none",
                shown === i && "bg-muted/60",
              )}
            >
              <span
                className="bg-chart-1 absolute inset-x-[22%] bottom-0 rounded-t-[4px] transition-all"
                style={{ height: `${y(r.actual)}%` }}
              />
              <span
                className="bg-foreground/70 absolute inset-x-[10%] h-0.5"
                style={{ bottom: `calc(${y(r.planned)}% - 1px)` }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5">
        {rows.map((r, i) => (
          <span
            key={r.key}
            className={cn(
              "text-muted-foreground min-w-0 flex-1 truncate text-center text-[10px]",
              shown === i && "text-foreground",
            )}
          >
            {r.label}
          </span>
        ))}
      </div>
      <TableView
        columns={["Period", actualLabel, plannedLabel, "Note"]}
        rows={rows.map((r) => ({
          Period: r.label,
          [actualLabel]: `${r.actual}${unit}`,
          [plannedLabel]: `${r.planned}${unit}`,
          Note: r.note ?? "",
        }))}
      />
    </figure>
  );
}

/** One measure per category as columns, with an optional neutral reference line. */
export function Columns({
  rows,
  unit = "%",
  max = 100,
  reference,
  height = 120,
}: {
  rows: { key: string; label: string; value: number | null; note?: string }[];
  unit?: string;
  max?: number;
  /** e.g. the Route's standard fill rate. */
  reference?: { value: number; label: string };
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const focus = hover === null ? null : rows[hover];
  return (
    <figure className="space-y-2">
      <figcaption className="text-muted-foreground flex justify-between gap-2 text-xs">
        <span>
          {focus ? (
            <>
              <span className="text-foreground font-medium">{focus.label}</span>
              {": "}
              <span className="text-foreground font-mono tabular-nums">
                {focus.value === null ? "no data" : `${focus.value}${unit}`}
              </span>
              {focus.note ? ` · ${focus.note}` : ""}
            </>
          ) : (
            "Hover a column for its value"
          )}
        </span>
        {reference ? (
          <span className="flex items-center gap-1.5">
            <span className="border-muted-foreground inline-block w-3 border-t border-dashed" />
            {reference.label} {reference.value}
            {unit}
          </span>
        ) : null}
      </figcaption>
      <div className="relative border-b" style={{ height }}>
        {reference ? (
          <span
            aria-hidden
            className="border-muted-foreground/60 absolute inset-x-0 border-t border-dashed"
            style={{ bottom: `${(reference.value / max) * 100}%` }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-end gap-1.5">
          {rows.map((r, i) => (
            <button
              key={r.key}
              type="button"
              aria-label={`${r.label}: ${r.value === null ? "no data" : `${r.value}${unit}`}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onBlur={() => setHover(null)}
              className={cn(
                "relative h-full min-w-0 flex-1 rounded-t outline-none",
                hover === i && "bg-muted/60",
              )}
            >
              {r.value !== null ? (
                <span
                  className="bg-chart-1 absolute inset-x-[22%] bottom-0 rounded-t-[4px]"
                  style={{ height: `${Math.min(100, (r.value / max) * 100)}%` }}
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5">
        {rows.map((r) => (
          <span
            key={r.key}
            className="text-muted-foreground min-w-0 flex-1 truncate text-center text-[10px]"
          >
            {r.label}
          </span>
        ))}
      </div>
      <TableView
        columns={["Category", "Value", "Note"]}
        rows={rows.map((r) => ({
          Category: r.label,
          Value: r.value === null ? "-" : `${r.value}${unit}`,
          Note: r.note ?? "",
        }))}
      />
    </figure>
  );
}

/** Counts per category as horizontal bars, largest first, values labelled. */
export function BarList({
  rows,
  empty = "Nothing to show",
}: {
  rows: { key: string; label: string; value: number; tag?: string }[];
  empty?: string;
}) {
  if (!rows.length)
    return <p className="text-muted-foreground py-4 text-sm">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li
          key={r.key}
          className="grid grid-cols-[10rem_1fr_2rem] items-center gap-3 text-sm"
          title={`${r.label}: ${r.value}`}
        >
          <span className="truncate">
            {r.label}
            {r.tag ? (
              <span className="text-muted-foreground ml-1.5 text-xs">
                {r.tag}
              </span>
            ) : null}
          </span>
          <span className="bg-muted h-2 overflow-hidden rounded-full">
            <span
              className="bg-chart-1 block h-full rounded-full"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </span>
          <span className="text-end font-mono text-xs tabular-nums">
            {r.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The chart's numbers as a table, behind a disclosure (screen readers, exact values). */
function TableView({
  columns,
  rows,
}: {
  /** Unique column names; the first one labels the row. */
  columns: string[];
  rows: Record<string, string>[];
}) {
  return (
    <details className="text-xs">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer select-none">
        Show as table
      </summary>
      <table className="mt-2 w-full">
        <thead>
          <tr className="text-muted-foreground text-left">
            {columns.map((col) => (
              <th key={col} className="py-1 pr-3 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[columns[0]]} className="border-t">
              {columns.map((col) => (
                <td
                  key={col}
                  className={cn(
                    "py-1 pr-3",
                    col !== columns[0] && "font-mono tabular-nums",
                  )}
                >
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
