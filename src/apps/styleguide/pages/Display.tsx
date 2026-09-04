import { Check, Star } from "lucide-react";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Demo, SectionHeader, Swatch } from "../components";

const BADGE_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "destructive",
  "ghost",
  "link",
] as const;

export default function DisplayPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Display"
        description="Small, non-interactive data-display primitives: badges for status and tags, avatars for people, separators for grouping."
      />

      <Demo title="Badge variants">
        <div className="flex flex-wrap items-center gap-3">
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Demo>

      <Demo title="Badge with icon">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>
            <Check data-icon="inline-start" />
            Approved
          </Badge>
          <Badge variant="secondary">
            <Star data-icon="inline-start" />
            Priority
          </Badge>
        </div>
      </Demo>

      <Demo title="Avatar sizes">
        <div className="flex items-center gap-4">
          <Swatch label="sm">
            <Avatar size="sm">
              <AvatarFallback>PN</AvatarFallback>
            </Avatar>
          </Swatch>
          <Swatch label="default">
            <Avatar>
              <AvatarFallback>MO</AvatarFallback>
            </Avatar>
          </Swatch>
          <Swatch label="lg">
            <Avatar size="lg">
              <AvatarFallback>ES</AvatarFallback>
            </Avatar>
          </Swatch>
          <Swatch label="with badge">
            <Avatar size="lg">
              <AvatarFallback>HW</AvatarFallback>
              <AvatarBadge />
            </Avatar>
          </Swatch>
        </div>
      </Demo>

      <Demo title="Separator">
        <div className="max-w-sm space-y-3 text-sm">
          <p>Section one</p>
          <Separator />
          <p>Section two</p>
          <div className="flex h-5 items-center gap-3">
            <span>Inline</span>
            <Separator orientation="vertical" />
            <span>Vertical</span>
          </div>
        </div>
      </Demo>
    </div>
  );
}
