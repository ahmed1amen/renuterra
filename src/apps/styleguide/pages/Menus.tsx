"use client";

import { ChevronDown, Copy, Download, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Code, Demo, SectionHeader } from "../components";

export default function MenusPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="13"
        title="Menus & toasts"
        description={
          <>
            Dropdown menus, popovers and dialogs at the popover elevation;
            toasts via sonner, mounted once in <Code>AppProviders</Code>.
            Destructive items take the destructive tone, never a red fill.
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
        <Demo title="Popover">
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>
              Pickup window
            </PopoverTrigger>
            <PopoverContent align="start">
              <PopoverHeader>
                <PopoverTitle>Thursday pickup</PopoverTitle>
                <PopoverDescription>
                  Driver arrives between 06:00 and 08:00. Bins out by 05:45.
                </PopoverDescription>
              </PopoverHeader>
              <Button size="sm" className="self-end">
                Got it
              </Button>
            </PopoverContent>
          </Popover>
        </Demo>
        <Demo title="Dialog">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Archive client
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Archive Sparklo?</DialogTitle>
                <DialogDescription>
                  Their quotes and invoices stay searchable; scheduled pickups
                  stop at the end of the month.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button onClick={() => toast.success("Client archived")}>
                  Archive
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Demo>
      </div>
    </div>
  );
}
