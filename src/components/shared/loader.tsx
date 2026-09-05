import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <output className={cn("flex items-center justify-center py-12", className)}>
      <Loader2 className="text-muted-foreground size-5 animate-spin" />
      <span className="sr-only">{label}</span>
    </output>
  );
}
