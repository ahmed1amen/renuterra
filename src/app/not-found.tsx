import Link from "next/link";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/layouts";

export default function NotFound() {
  return (
    <AppLayout>
      <EmptyState
        title="Page not found"
        description="That URL doesn't match any page in this app."
        action={
          <Button variant="outline" size="sm" render={<Link href="/" />}>
            Back to dashboard
          </Button>
        }
      />
    </AppLayout>
  );
}
