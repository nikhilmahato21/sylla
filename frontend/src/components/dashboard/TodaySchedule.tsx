import { format } from "date-fns";
import { Topic } from "@/types";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  DONE: "text-primary border-primary/30 bg-primary/10",
  IN_PROGRESS: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  PENDING: "text-muted-foreground border-border bg-secondary",
  REVISION: "text-blue-400 border-blue-400/30 bg-blue-400/10",
};

const statusLabels: Record<string, string> = {
  DONE: "Done",
  IN_PROGRESS: "Now",
  PENDING: "Upcoming",
  REVISION: "Revision",
};

const hours = ["08:00", "10:30", "14:00", "17:00"];

export function TodaySchedule({ topics }: { topics: Topic[] }) {
  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Today's Schedule</h3>
        <span className="font-mono text-xs bg-secondary border border-border rounded px-2 py-1 text-muted-foreground">
          {format(today, "MMM d")}
        </span>
      </div>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-muted-foreground text-sm">No topics scheduled</p>
          <p className="text-xs text-muted-foreground/60 mt-1 font-mono">Add subjects and topics to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.slice(0, 4).map((topic, i) => (
            <div key={topic.id} className="flex items-start gap-3">
              <span className="font-mono text-[11px] text-muted-foreground w-10 pt-0.5 shrink-0">
                {hours[i] || "—"}
              </span>
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
                  topic.status === "DONE" ? "bg-primary" :
                  topic.status === "IN_PROGRESS" ? "bg-orange-400" : "border border-border bg-transparent"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{topic.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                  {topic.estimatedMinutes} min
                </p>
              </div>
              <span
                className={cn(
                  "font-mono text-[10px] border rounded px-2 py-0.5 shrink-0",
                  statusColors[topic.status]
                )}
              >
                {statusLabels[topic.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
