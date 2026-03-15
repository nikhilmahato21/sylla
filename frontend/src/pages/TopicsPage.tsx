import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Clock, RefreshCw, Circle, Trash2, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { Topic, TopicStatus } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { startStudySession } from "@/components/dashboard/SessionTimer";

const STATUS_COLUMNS: { status: TopicStatus; label: string; icon: any; color: string }[] = [
  { status: "PENDING", label: "Pending", icon: Circle, color: "text-muted-foreground" },
  { status: "IN_PROGRESS", label: "In Progress", icon: Clock, color: "text-orange-400" },
  { status: "DONE", label: "Done", icon: CheckCircle2, color: "text-primary" },
  { status: "REVISION", label: "Revision", icon: RefreshCw, color: "text-blue-400" },
];

const schema = z.object({
  name: z.string().min(1, "Topic name required"),
  description: z.string().optional(),
  estimatedMinutes: z.coerce.number().min(5).max(480).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

type FormData = z.infer<typeof schema>;

export function TopicsPage() {
  const { subjectId } = useParams();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { estimatedMinutes: 60, priority: "MEDIUM" },
  });

  useEffect(() => {
    loadTopics();
    if (subjectId) loadSubject();
  }, [subjectId]);

  async function loadSubject() {
    try {
      const { data } = await api.get("/subjects");
      const s = data.find((s: any) => s.id === subjectId);
      if (s) setSubjectName(s.name);
    } catch {}
  }

  async function loadTopics() {
    try {
      const params = subjectId ? { subjectId } : {};
      const { data } = await api.get("/topics", { params });
      setTopics(data);
    } catch {
      toast({ title: "Failed to load topics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      const { data: created } = await api.post("/topics", {
        ...data,
        subjectId: subjectId!,
      });
      setTopics((prev) => [...prev, created]);
      reset();
      setShowForm(false);
      toast({ title: "Topic added" });
    } catch (err) {
      toast({ title: "Failed to add topic", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function updateStatus(topicId: string, status: TopicStatus) {
    try {
      await api.patch(`/topics/${topicId}/status`, { status });
      setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, status } : t));
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  }

  async function deleteTopic(id: string) {
    try {
      await api.delete(`/topics/${id}`);
      setTopics((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Topic deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  async function handleStartSession(topic: Topic) {
    try {
      const activeRaw = sessionStorage.getItem("sylla_active_session");
      if (activeRaw) {
        const active = JSON.parse(activeRaw) as { topicId?: string; topicName?: string };
        if (active.topicId === topic.id) {
          toast({ title: "This session is already running" });
          return;
        }

        toast({
          title: `Finish "${active.topicName ?? "your active topic"}" before starting another session`,
          variant: "destructive",
        });
        return;
      }

      await startStudySession(topic.id, topic.name);
      setTopics((prev) => prev.map((t) => (
        t.id === topic.id ? { ...t, status: "IN_PROGRESS" } : t
      )));
      toast({ title: "Session started" });
    } catch (err) {
      toast({
        title: "Failed to start session",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  const topicsByStatus = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.status] = topics.filter((t) => t.status === col.status);
    return acc;
  }, {} as Record<TopicStatus, Topic[]>);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={subjectName || "Topics"}
        subtitle={`${topics.length} topics total`}
        actions={
          subjectId && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} />
              Add Topic
            </button>
          )
        }
      />

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h3 className="font-semibold mb-4">New Topic</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">TOPIC NAME</label>
                  <input
                    {...register("name")}
                    placeholder="e.g. Eigenvalues and Eigenvectors"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">EST. MINUTES</label>
                  <input
                    {...register("estimatedMinutes")}
                    type="number"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">DESCRIPTION</label>
                  <input
                    {...register("description")}
                    placeholder="Brief notes about this topic..."
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">PRIORITY</label>
                  <select
                    {...register("priority")}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  {isSubmitting ? "Adding..." : "Add Topic"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban columns */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((col) => {
            const Icon = col.icon;
            const items = topicsByStatus[col.status] || [];
            return (
              <div key={col.status} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={13} className={col.color} />
                  <span className="font-mono text-xs text-muted-foreground">{col.label}</span>
                  <span className="ml-auto font-mono text-xs bg-secondary rounded px-1.5 py-0.5 text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[120px]">
                  <AnimatePresence>
                    {items.map((topic) => (
                      <motion.div
                        key={topic.id}
                        layout
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-secondary border border-border/50 rounded-lg p-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-foreground font-medium leading-relaxed flex-1">{topic.name}</p>
                          <button
                            onClick={() => deleteTopic(topic.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <p className="font-mono text-[10px] text-muted-foreground mt-1">
                          {topic.estimatedMinutes}min · {topic.priority}
                        </p>

                        {(topic.status === "PENDING" || topic.status === "REVISION") && (
                          <button
                            onClick={() => handleStartSession(topic)}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            ▶ Start Session
                          </button>
                        )}

                        {/* Quick status change */}
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {STATUS_COLUMNS.filter((c) => c.status !== col.status).map((c) => (
                            <button
                              key={c.status}
                              onClick={() => updateStatus(topic.id, c.status)}
                              className="font-mono text-[9px] text-muted-foreground hover:text-foreground border border-border/50 rounded px-1.5 py-0.5 transition-colors hover:border-border"
                            >
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
