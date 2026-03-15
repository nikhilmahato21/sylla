import { StreakData } from "@/types";
import { cn } from "@/lib/utils";

export function StudyStreakGrid({ streak }: { streak: StreakData | null }) {
  // Build a 21-day grid (3 weeks)
  const today = new Date();
  const days: { date: string; studied: boolean; isToday: boolean }[] = [];

  for (let i = 20; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      studied: streak?.dates.includes(dateStr) ?? false,
      isToday: i === 0,
    });
  }

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-semibold text-foreground">Study Streak</h3>
        {(streak?.streak ?? 0) > 0 && (
          <span className="flex items-center gap-1.5 font-mono text-xs bg-orange-400/10 border border-orange-400/20 text-orange-400 rounded-full px-2.5 py-0.5">
            🔥 {streak?.streak} days
          </span>
        )}
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center font-mono text-[9px] text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            title={day.date}
            className={cn(
              "aspect-square rounded-sm transition-colors",
              day.studied
                ? "bg-primary"
                : day.isToday
                ? "bg-secondary border border-border"
                : "bg-secondary/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
