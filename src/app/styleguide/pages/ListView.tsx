"use client";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  FilterX,
  ListFilter,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, StatusPill, type StatusTone } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { findUser, LEADS, type LeadSource, type LeadStatus } from "@/mocks";
import { Code, Note, SectionHeader } from "../components";

/* ------------------------------------------------------------------ data */

type Row = {
  id: string;
  name: string;
  company: string;
  status: LeadStatus;
  source: LeadSource;
  owner: string;
  createdAt: string;
};

/** 48 deterministic rows derived from the lead fixtures — enough to page. */
const ROWS: Row[] = Array.from({ length: 48 }, (_, index) => {
  const lead = LEADS[index % LEADS.length];
  const cycle = Math.floor(index / LEADS.length);
  return {
    id: `${lead.id}_${String(index + 1).padStart(2, "0")}`,
    name: `${lead.firstName} ${lead.lastName}`,
    company: cycle === 0 ? lead.company : `${lead.company} — site ${cycle + 1}`,
    status: lead.status,
    source: lead.source,
    owner: findUser(lead.ownerId)?.name ?? "Unassigned",
    createdAt: new Date(
      Date.parse(lead.createdAt) - index * 36e5 * 7,
    ).toISOString(),
  };
});

const STATUS_TONES: Record<LeadStatus, { label: string; tone: StatusTone }> = {
  new: { label: "New", tone: "info" },
  contacted: { label: "Contacted", tone: "warning" },
  qualified: { label: "Qualified", tone: "success" },
  unqualified: { label: "Unqualified", tone: "neutral" },
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  web: "Web",
  referral: "Referral",
  event: "Event",
  outbound: "Outbound",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.entries(STATUS_TONES).map(([value, s]) => ({
    value,
    label: s.label,
  })),
];

const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
];

const OWNER_OPTIONS = [
  { value: "all", label: "All owners" },
  ...[...new Set(ROWS.map((r) => r.owner))].map((owner) => ({
    value: owner,
    label: owner,
  })),
];

const PAGE_SIZES = [10, 25, 50];

/** Stable keys so skeleton rows never use an array index. */
const SKELETON_KEYS = Array.from(
  { length: Math.max(...PAGE_SIZES) },
  (_, i) => `skeleton-${i}`,
);

type SortField = "name" | "status" | "source" | "created";
type SortDirection = "asc" | "desc";

const DEFAULTS = {
  search: "",
  status: "all",
  source: "all",
  owner: "all",
  createdAfter: "",
  sortField: "created" as SortField,
  sortDirection: "desc" as SortDirection,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------ subcomponents */

/** Sortable column header; an optional filter sits beside the sort control. */
function SortableHead({
  field,
  label,
  sortField,
  sortDirection,
  onSort,
  children,
  className,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  children?: React.ReactNode;
  className?: string;
}) {
  const active = sortField === field;
  return (
    <TableHead className={cn("px-3", className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSort(field)}
          aria-label={`Sort by ${label}`}
          className="hover:text-foreground -mx-1 flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors"
        >
          {label}
          <ArrowUpDown
            className={cn(
              "size-3.5",
              active ? "text-primary" : "text-muted-foreground/60",
            )}
            aria-hidden
          />
          {active ? (
            <span className="sr-only">
              sorted {sortDirection === "asc" ? "ascending" : "descending"}
            </span>
          ) : null}
        </button>
        {children}
      </div>
    </TableHead>
  );
}

/** Per-column value filter, rendered as a radio dropdown on the header. */
function ColumnFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const active = value !== "all";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            className={active ? "text-primary" : "text-muted-foreground/60"}
          />
        }
      >
        <ListFilter />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {SKELETON_KEYS.slice(0, count).map((key) => (
        <TableRow key={key}>
          <TableCell className="px-3 py-2.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-3 w-28" />
          </TableCell>
          <TableCell className="px-3">
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="px-3">
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell className="px-3">
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="px-3">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="px-3">
            <Skeleton className="ml-auto size-7" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------- page */

export default function ListViewPage() {
  const searchId = useId();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState(DEFAULTS.search);
  const [status, setStatus] = useState(DEFAULTS.status);
  const [source, setSource] = useState(DEFAULTS.source);
  const [owner, setOwner] = useState(DEFAULTS.owner);
  const [createdAfter, setCreatedAfter] = useState(DEFAULTS.createdAfter);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>(DEFAULTS.sortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    DEFAULTS.sortDirection,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]);

  // Fake the round-trip so the loading state is visible, like a real fetch.
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const after = createdAfter ? Date.parse(createdAfter) : null;
    const filtered = ROWS.filter((row) => {
      if (deleted.includes(row.id)) return false;
      if (status !== "all" && row.status !== status) return false;
      if (source !== "all" && row.source !== source) return false;
      if (owner !== "all" && row.owner !== owner) return false;
      if (after !== null && Date.parse(row.createdAt) < after) return false;
      if (
        term &&
        !`${row.name} ${row.company} ${row.id}`.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });

    const direction = sortDirection === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      if (sortField === "created") {
        return (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * direction;
      }
      const key = sortField === "name" ? "name" : sortField;
      return a[key].localeCompare(b[key]) * direction;
    });
  }, [
    search,
    status,
    source,
    owner,
    createdAfter,
    sortField,
    sortDirection,
    deleted,
  ]);

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  const dirty =
    search !== DEFAULTS.search ||
    status !== DEFAULTS.status ||
    source !== DEFAULTS.source ||
    owner !== DEFAULTS.owner ||
    createdAfter !== DEFAULTS.createdAfter ||
    sortField !== DEFAULTS.sortField ||
    sortDirection !== DEFAULTS.sortDirection;

  const reload = useCallback((ms = 450) => {
    setLoading(true);
    setTimeout(() => setLoading(false), ms);
  }, []);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
    reload(250);
  };

  const clearFilters = () => {
    setSearch(DEFAULTS.search);
    setStatus(DEFAULTS.status);
    setSource(DEFAULTS.source);
    setOwner(DEFAULTS.owner);
    setCreatedAfter(DEFAULTS.createdAfter);
    setSortField(DEFAULTS.sortField);
    setSortDirection(DEFAULTS.sortDirection);
    setShowFilters(false);
    setPage(1);
    reload(250);
    toast.info("Filters cleared");
  };

  const refresh = () => {
    setRefreshing(true);
    setLoading(true);
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
      toast.success("List refreshed");
    }, 700);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setDeleted((prev) => [...prev, pendingDelete.id]);
    toast.success(`${pendingDelete.name} deleted — prototype only`);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        number="15"
        title="List view"
        description={
          <>
            The standard index screen: search and bulk actions in the toolbar,
            optional advanced filters, a sortable table with per-column filters,
            and paging in the footer. Loading swaps rows for skeletons — the
            frame never jumps. Row click opens the record; the actions menu owns
            everything destructive.
          </>
        }
      />

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {/* Toolbar */}
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="relative w-full max-w-sm">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <label className="sr-only" htmlFor={searchId}>
              Search leads
            </label>
            <Input
              id={searchId}
              value={search}
              placeholder="Search name, company or ID…"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pr-8 pl-8"
            />
            {search ? (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-1 -translate-y-1/2"
              >
                <X />
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!dirty}
            >
              <FilterX data-icon="inline-start" />
              Clear filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
            >
              <Filter data-icon="inline-start" />
              {showFilters ? "Hide filters" : "Filters"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={refreshing}
            >
              <RefreshCw
                data-icon="inline-start"
                className={refreshing ? "animate-spin" : undefined}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("New lead — prototype only")}
            >
              <Plus data-icon="inline-start" />
              New lead
            </Button>
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters ? (
          <div className="border-border bg-muted/40 grid gap-4 border-b px-4 py-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="filter-created">Created after</Label>
              <Input
                id="filter-created"
                type="date"
                value={createdAfter}
                onChange={(e) => {
                  setCreatedAfter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-source">Source</Label>
              <NativeSelect
                id="filter-source"
                className="w-full"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setPage(1);
                }}
              >
                {SOURCE_OPTIONS.map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-owner">Owner</Label>
              <NativeSelect
                id="filter-owner"
                className="w-full"
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  setPage(1);
                }}
              >
                {OWNER_OPTIONS.map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
        ) : null}

        {/* Table */}
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <SortableHead
                field="name"
                label="Lead"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                field="status"
                label="Status"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                <ColumnFilter
                  label="Filter by status"
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                />
              </SortableHead>
              <SortableHead
                field="source"
                label="Source"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                <ColumnFilter
                  label="Filter by source"
                  value={source}
                  options={SOURCE_OPTIONS}
                  onChange={(v) => {
                    setSource(v);
                    setPage(1);
                  }}
                />
              </SortableHead>
              <TableHead className="px-3">Owner</TableHead>
              <SortableHead
                field="created"
                label="Created"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHead className="px-3 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows count={pageSize} />
            ) : pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={SearchX}
                    title="No leads found"
                    description="No records match the current search and filters."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        <FilterX data-icon="inline-start" />
                        Clear filters
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="even:bg-muted/20 cursor-pointer"
                  onClick={() => toast.info(`Open ${row.id} — prototype only`)}
                >
                  <TableCell className="px-3 py-2.5">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {row.company}
                      <span className="font-mono"> · {row.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3">
                    <StatusPill tone={STATUS_TONES[row.status].tone} dot>
                      {STATUS_TONES[row.status].label}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="px-3">
                    <StatusPill tone="neutral">
                      {SOURCE_LABELS[row.source]}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-muted-foreground px-3">
                    {row.owner}
                  </TableCell>
                  <TableCell className="text-muted-foreground px-3">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell
                    className="px-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${row.name}`}
                          />
                        }
                      >
                        <MoreVertical />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem>
                          <Pencil />
                          Edit lead
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send />
                          Send quote
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setPendingDelete(row)}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-border text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-[13px]">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <NativeSelect
              size="sm"
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((size) => (
                <NativeSelectOption key={size} value={size}>
                  {size}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex items-center gap-3">
            <span>
              {total === 0 ? 0 : start + 1}–{Math.min(start + pageSize, total)}{" "}
              of {total}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => {
                  setPage(currentPage - 1);
                  reload(250);
                }}
              >
                <ChevronLeft />
              </Button>
              <span className="text-foreground px-1 font-medium">
                {currentPage} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={currentPage === pageCount}
                onClick={() => {
                  setPage(currentPage + 1);
                  reload(250);
                }}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this lead?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `${pendingDelete.name} · ${pendingDelete.company} will be removed from the list. This cannot be undone.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="danger" onClick={confirmDelete}>
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Note title="Rules for list screens">
        Filters are additive and always visible once set — a filtered list must
        never look like an empty one, so the empty state offers{" "}
        <Code>Clear filters</Code>. Sorting and paging reset to page 1. Keep the
        row click for “open”, never for a destructive action, and put every
        mutation behind the row menu with a confirm step. Skeletons match the
        real row height so the table does not reflow. Data here is fixture-only
        and filtered client-side; a real screen swaps that for the query hooks
        in <Code>features/crm</Code>.
      </Note>
    </div>
  );
}
