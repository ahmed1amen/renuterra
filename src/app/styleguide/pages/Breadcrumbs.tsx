import { Slash } from "lucide-react";
import { PageHeader } from "@/components/shared";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Code, Demo, Note, SectionHeader } from "../components";

export default function BreadcrumbsPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="11"
        title="Breadcrumbs"
        description={
          <>
            The trail back up the hierarchy, 14px, muted links with a{" "}
            <Code>ChevronRight</Code> separator; the last crumb is the current
            page and never a link. Pass <Code>breadcrumbs</Code> to{" "}
            <Code>PageHeader</Code> — it sits above the title and inherits the
            page gutters.
          </>
        }
      />

      <Demo title="Default" hint="two levels — the Dashboard recipe">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Demo>

      <Demo title="Deep trail" hint="three or more levels">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Clients</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                American Hospital Dubai
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Collections</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Demo>

      <Demo
        title="Collapsed"
        hint="ellipsis for long trails; keep first and last two"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                Site 4 — Al Quoz
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Manifest #10428</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Demo>

      <Demo title="Custom separator" hint="slash — use sparingly, one per app">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Reporting</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Demo>

      <Demo title="In a page header" hint="PageHeader breadcrumbs prop">
        <PageHeader
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
          title="Dashboard"
          description="Pipeline, leads and team activity at a glance."
        />
      </Demo>

      <Note title="When to use">
        Show breadcrumbs on any screen more than one level below a section root
        — detail pages, nested settings, drill-downs from a table. Skip them on
        top-level screens, where the sidebar already answers “where am I”. Keep
        labels the same words as the item they point at, and never make the
        current page clickable.
      </Note>
    </div>
  );
}
