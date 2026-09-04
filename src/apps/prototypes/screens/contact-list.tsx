"use client";

import { Search, SearchX, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useContacts } from "@/features/crm";
import type { Contact } from "@/mocks";
import { CrmTabBar, Screen, ScreenBody } from "../components";
import { initials } from "../utils/format";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5, 6];

export function ContactList() {
  const contacts = useContacts();
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = (contacts.data ?? [])
      .filter(
        (c) =>
          !term ||
          `${c.firstName} ${c.lastName} ${c.company}`
            .toLowerCase()
            .includes(term),
      )
      .sort((a, b) => a.lastName.localeCompare(b.lastName));

    const byLetter = new Map<string, Contact[]>();
    for (const c of filtered) {
      const letter = c.lastName[0]?.toUpperCase() ?? "#";
      byLetter.set(letter, [...(byLetter.get(letter) ?? []), c]);
    }
    return [...byLetter.entries()];
  }, [contacts.data, search]);

  return (
    <Screen>
      <div className="px-4 pt-2">
        <PageHeader
          title="Contacts"
          actions={
            <Button size="icon" aria-label="Add contact">
              <UserPlus />
            </Button>
          }
        />
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts"
            aria-label="Search contacts"
            className="h-10 ps-9"
          />
        </div>
      </div>

      <ScreenBody className="px-0">
        {contacts.isPending ? (
          <ul
            className="space-y-1 px-4"
            aria-busy
            aria-label="Loading contacts"
          >
            {SKELETON_ROWS.map((n) => (
              <li key={n} className="flex items-center gap-3 py-2.5">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : contacts.isError ? (
          <ErrorState
            title="Couldn't load contacts"
            error={contacts.error}
            onRetry={() => contacts.refetch()}
          />
        ) : groups.length === 0 ? (
          search.trim() ? (
            <EmptyState
              icon={SearchX}
              title="No matching contacts"
              description="Check the spelling or try a company name."
            />
          ) : (
            <EmptyState
              title="No contacts yet"
              description="People you add or import will be listed here alphabetically."
              action={
                <Button size="sm">
                  <UserPlus data-icon="inline-start" />
                  Add contact
                </Button>
              }
            />
          )
        ) : (
          groups.map(([letter, items]) => (
            <section key={letter}>
              <h2 className="bg-muted/80 text-muted-foreground sticky top-0 z-10 px-4 py-1 text-xs font-semibold backdrop-blur">
                {letter}
              </h2>
              <ul className="divide-border divide-y px-4">
                {items.map((c) => (
                  <li key={c.id}>
                    <ContactRow contact={c} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </ScreenBody>

      <CrmTabBar active="contacts" />
    </Screen>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  return (
    <button
      type="button"
      className="hover:bg-muted/50 -mx-4 flex w-[calc(100%+2rem)] items-center gap-3 px-4 py-2.5 text-left outline-none focus-visible:bg-muted/50"
    >
      <Avatar>
        <AvatarFallback>
          {initials(contact.firstName, contact.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {contact.firstName}{" "}
          <span className="font-semibold">{contact.lastName}</span>
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {contact.title} · {contact.company}
        </p>
      </div>
      {contact.tags.length > 0 ? (
        <div className="flex shrink-0 gap-1">
          {contact.tags.slice(0, 1).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {contact.tags.length > 1 ? (
            <Badge variant="ghost">+{contact.tags.length - 1}</Badge>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
