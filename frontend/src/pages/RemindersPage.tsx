import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Trash2, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { Reminder } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  scheduledAt: z.string().min(1),
  type: z.enum(["STUDY", "REVISION", "EXAM"]),
});
type FormData = z.infer<typeof schema>;

const typeColors: Record<string, string> = {
  STUDY: "text-primary bg-primary/10 border-primary/20",
  REVISION: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  EXAM: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

export function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "STUDY" },
  });

  useEffect(() => {
    api.get("/reminders").then(({ data }) => setReminders(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function onSubmit(data: FormData) {
    try {
      const { data: created } = await api.post("/reminders", {
        ...data,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      });
      setReminders((prev) => [...prev, created]);
      reset();
      setShowForm(false);
      toast({ title: "Reminder set!" });
    } catch (err) {
      toast({ title: "Failed to create reminder", variant: "destructive" });
    }
  }

  async function deleteReminder(id: string) {
    try {
      await api.delete(`/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  const upcoming = reminders.filter((r) => !r.sent && new Date(r.scheduledAt) > new Date());
  const past = reminders.filter((r) => r.sent || new Date(r.scheduledAt) <= new Date());

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <PageHeader
        title="Reminders"
        subtitle={`${upcoming.length} upcoming`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={14} />
            Add Reminder
          </button>
        }
      />

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h3 className="font-semibold mb-4">New Reminder</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">TITLE</label>
                  <input {...register("title")} placeholder="e.g. Study Physics" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">TYPE</label>
                  <select {...register("type")} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="STUDY">Study</option>
                    <option value="REVISION">Revision</option>
                    <option value="EXAM">Exam</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">MESSAGE</label>
                <input {...register("message")} placeholder="Reminder message..." className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">SCHEDULED AT</label>
                <input {...register("scheduledAt")} type="datetime-local" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Set Reminder"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-3">UPCOMING</p>
          <div className="space-y-2">
            {upcoming.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 group"
              >
                <Bell size={14} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("font-mono text-[9px] border rounded px-1.5 py-0.5", typeColors[r.type])}>
                    {r.type}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock size={10} />
                    {format(new Date(r.scheduledAt), "MMM d, h:mm a")}
                  </span>
                  <button onClick={() => deleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-3">PAST</p>
          <div className="space-y-2 opacity-50">
            {past.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                <Bell size={14} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground line-through">{r.title}</p>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {format(new Date(r.scheduledAt), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && reminders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No reminders yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Set study reminders to stay on track</p>
        </div>
      )}
    </div>
  );
}
