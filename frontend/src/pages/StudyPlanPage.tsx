import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Calendar, Clock, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function StudyPlanPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [hours, setHours] = useState("4");
  const [examDate, setExamDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    api.get("/plans").then(({ data }) => setPlans(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function generatePlan() {
    setGenerating(true);
    try {
      const { data } = await api.post("/ai/study-plan", {
        availableHoursPerDay: parseFloat(hours) || 4,
        examDate: examDate ? new Date(examDate).toISOString() : undefined,
      });
      setPlans((prev) => [data, ...prev]);
      setSelectedPlan(data);
      toast({ title: "Study plan generated!" });
    } catch (err) {
      toast({ title: "Failed to generate plan", description: (err as Error).message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function deletePlan(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.delete(`/plans/${id}`);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (selectedPlan?.id === id) setSelectedPlan(null);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <PageHeader title="AI Planner" subtitle="Generate intelligent study schedules" />

      {/* Generator */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-primary" />
          <h3 className="font-semibold">Generate New Plan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">HOURS PER DAY</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="1" max="12" step="0.5"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">TARGET DATE (OPTIONAL)</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generatePlan}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plans list */}
          <div className="space-y-2">
            <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-3">SAVED PLANS</p>
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No plans yet. Generate one above!</p>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                    selectedPlan?.id === plan.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{plan.title}</p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(plan.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deletePlan(plan.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Plan detail */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedPlan ? (
                <motion.div
                  key={selectedPlan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <h3 className="font-semibold text-foreground mb-2">{selectedPlan.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    {selectedPlan.content?.summary || selectedPlan.summary}
                  </p>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(selectedPlan.content?.schedule || selectedPlan.schedule || []).map((day: any, i: number) => (
                      <div key={i} className="border-l-2 border-border pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={12} className="text-primary" />
                          <span className="font-mono text-xs text-muted-foreground">
                            {day.date ? format(new Date(day.date), "EEE, MMM d") : `Day ${i + 1}`}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {day.sessions?.map((s: any, j: number) => (
                            <div key={j} className="flex items-center gap-2 py-1.5 bg-secondary rounded-lg px-3">
                              <span className="font-mono text-[10px] text-muted-foreground w-12">{s.time}</span>
                              <span className="text-xs text-foreground flex-1">{s.subject} — {s.topic}</span>
                              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                                <Clock size={10} />{s.durationMin}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center bg-card border border-border rounded-xl">
                  <Calendar size={24} className="text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Select a plan to view details</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
