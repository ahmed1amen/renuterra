"use client";

import { ChevronDown, Copy, Download, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Code, Demo, SectionHeader } from "../components";

export default function MenusPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="13"
        title="Menus & toasts"
        description={
          <>
            Dropdown menus at the popover elevation; toasts via sonner, mounted
            once in <Code>AppProviders</Code>. Destructive items take the
            destructive tone, never a red fill.
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4">
        <Demo title="Dropdown menu">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Quote actions
              <ChevronDown data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>QT-2026-0418</DropdownMenuLabel>
              <DropdownMenuItem>
                <Send />
                Send reminder
                <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 />
                Delete quote
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Demo>
        <Demo title="Toasts">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast("Event recorded")}>
              Default
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Quote sent to Sparklo", {
                  description: "They'll get a link to accept in myRenuterra.",
                  action: { label: "Undo", onClick: () => toast("Recalled") },
                })
              }
            >
              Success
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.warning("Permit expires in 14 days")}
            >
              Warning
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error("Couldn't reach the tracking service")}
            >
              Error
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.promise(
                  new Promise((resolve) => setTimeout(resolve, 1500)),
                  {
                    loading: "Generating PDF…",
                    success: "PDF ready",
                    error: "Could not generate",
                  },
                )
              }
            >
              Promise
            </Button>
          </div>
        </Demo>
      </div>
    </div>
  );
}
