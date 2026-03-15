import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Reminder } from "@/types";
import { format, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

function formatReminderTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow at ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

const typeColors: Record<string, string> = {
  STUDY: "text-primary",
  REVISION: "text-blue-400",
  EXAM: "text-orange-400",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    api.get("/reminders").then(({ data }) => {
      const upcoming = data.filter(
        (r: Reminder) => !r.sent && new Date(r.scheduledAt) > new Date()
      );
      setReminders(upcoming.slice(0, 5));
      setCount(upcoming.length);
    }).catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Bell size={15} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full font-mono text-[9px] text-primary-foreground flex items-center justify-center font-bold">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-40 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="font-mono text-xs text-muted-foreground tracking-widest">REMINDERS</p>
              </div>

              {reminders.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">No upcoming reminders</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {reminders.map((r) => (
                    <div key={r.id} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", typeColors[r.type].replace("text-", "bg-"))} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                            {formatReminderTime(r.scheduledAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 py-2.5 border-t border-border">
                <a
                  href="/reminders"
                  className="font-mono text-[11px] text-primary hover:underline"
                  onClick={() => setOpen(false)}
                >
                  View all reminders →
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
