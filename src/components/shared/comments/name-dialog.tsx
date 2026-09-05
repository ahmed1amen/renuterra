"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * First-comment identity prompt. The name lands in localStorage and is pure
 * attribution — no auth behind it.
 */
export function NameDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();

  const submit = () => {
    if (!trimmed) return;
    onSubmit(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Who's commenting?</DialogTitle>
          <DialogDescription>
            Your name is shown on pins and in threads so the team knows who said
            what. Stored only in this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comment-display-name" className="text-[13px]">
            Display name
          </Label>
          <Input
            id="comment-display-name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="e.g. Sara Al Ali"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!trimmed} onClick={submit}>
            Save name
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
