import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronRight, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Subject } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ec4899", "#14b8a6", "#eab308", "#ef4444"];

const schema = z.object({
  name: z.string().min(1, "Subject name required"),
  color: z.string().optional(),
  examDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    try {
      const { data } = await api.get("/subjects");
      setSubjects(data);
    } catch {
      toast({ title: "Failed to load subjects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      const { data: created } = await api.post("/subjects", {
        ...data,
        color: selectedColor,
        examDate: data.examDate ? new Date(data.examDate).toISOString() : null,
      });
      setSubjects((prev) => [...prev, created]);
      reset();
      setShowForm(false);
      toast({ title: "Subject created" });
    } catch (err) {
      toast({ title: "Failed to create subject", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function deleteSubject(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this subject and all its topics?")) return;
    try {
      await api.delete(`/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Subject deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <PageHeader
        title="Subjects"
        subtitle={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Add Subject
          </button>
        }
      />

      {/* Add Subject Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h3 className="font-semibold text-foreground mb-4">New Subject</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                    SUBJECT NAME
                  </label>
                  <input
                    {...register("name")}
                    placeholder="e.g. Linear Algebra"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {errors.name && <p className="text-destructive text-xs mt-1 font-mono">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                    EXAM DATE (OPTIONAL)
                  </label>
                  <input
                    {...register("examDate")}
                    type="date"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-muted-foreground mb-2 tracking-wider">
                  COLOR
                </label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        selectedColor === c ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Subject"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subjects grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={40} className="text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No subjects yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Add your first subject to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {subjects.map((subject, i) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/subjects/${subject.id}/topics`)}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-border/80 hover:bg-card/80 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1"
                    style={{ backgroundColor: subject.color }}
                  />
                  <button
                    onClick={(e) => deleteSubject(subject.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <h3 className="font-medium text-foreground mb-1">{subject.name}</h3>

                {subject.examDate && (
                  <p className="font-mono text-[10px] text-muted-foreground mb-3">
                    Exam: {format(new Date(subject.examDate), "MMM d, yyyy")}
                  </p>
                )}

                <div className="mt-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {subject.completedTopics}/{subject.totalTopics} topics
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {subject.completion}%
                    </span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${subject.completion}%`, backgroundColor: subject.color }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end mt-3">
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                    View topics <ChevronRight size={12} />
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
