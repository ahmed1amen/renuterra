import {
  CalendarDays,
  Circle,
  CircleCheck,
  type LucideIcon,
  Mail,
  Phone,
  StickyNote,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Activity, type ActivityType, findUser } from "@/mocks";
import { formatTime } from "../utils/format";

const ICONS: Record<ActivityType, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: CalendarDays,
  note: StickyNote,
  task: Circle,
};

/** One row in an activity timeline. Shared by the feed and detail screens. */
export function ActivityRow({
  activity,
  showRelated = false,
}: {
  activity: Activity;
  showRelated?: boolean;
}) {
  const Icon =
    activity.type === "task" && activity.completed
      ? CircleCheck
      : ICONS[activity.type];
  const actor = findUser(activity.actorId);
  const done = activity.type === "task" && activity.completed;

  return (
    <div className="flex gap-3 py-3">
      <span
        className={cn(
          "bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full",
          done && "text-foreground",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium",
              done && "text-muted-foreground line-through",
            )}
          >
            {activity.subject}
          </p>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {formatTime(activity.occurredAt)}
          </span>
        </div>
        {activity.body ? (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
            {activity.body}
          </p>
        ) : null}
        <div className="mt-1.5 flex items-center gap-2">
          {showRelated ? (
            <Badge variant="outline" className="max-w-full">
              <span className="truncate">{activity.relatedTo.name}</span>
            </Badge>
          ) : null}
          {actor ? (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Avatar size="sm">
                <AvatarFallback>{actor.initials}</AvatarFallback>
              </Avatar>
              {actor.name.split(" ")[0]}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
