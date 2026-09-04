"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Demo, SectionHeader } from "../components";

export default function FeedbackPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Feedback"
        description="Toasts via sonner. The <Toaster /> is mounted once in AppProviders."
      />

      <Demo title="Toast variants">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast("Event recorded")}>
            Default
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.success("Changes saved")}
          >
            Success
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error("Request failed")}
          >
            Error
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.warning("Check your input")}
          >
            Warning
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("Sync in progress")}
          >
            Info
          </Button>
        </div>
      </Demo>

      <Demo title="With description and action">
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Record archived", {
              description: "It will be permanently removed in 30 days.",
              action: { label: "Undo", onClick: () => toast("Restored") },
            })
          }
        >
          Show toast
        </Button>
      </Demo>

      <Demo title="Promise">
        <Button
          variant="outline"
          onClick={() =>
            toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
              loading: "Saving…",
              success: "Saved",
              error: "Could not save",
            })
          }
        >
          Run async task
        </Button>
      </Demo>
    </div>
  );
}
