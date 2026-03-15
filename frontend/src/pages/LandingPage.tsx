import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, BookOpen, TrendingUp, Bell, Check, ArrowRight,
  FileText, Calendar, Zap, BarChart2
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "AI Syllabus Parsing",
    desc: "Upload any PDF syllabus and let Gemini AI extract all topics automatically, with estimated study times and priority levels.",
  },
  {
    icon: Calendar,
    title: "Smart Study Plans",
    desc: "AI-generated daily schedules that adapt to your exam dates, available hours, and current progress.",
  },
  {
    icon: Sparkles,
    title: "Topic Recommendations",
    desc: "Get intelligent suggestions on what to study next based on your completion status and upcoming exams.",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    desc: "Visual charts showing completion rates, weekly study hours, and streak tracking across all subjects.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    desc: "Redis-powered reminder engine sends study alerts, revision prompts, and exam countdowns at the right time.",
  },
  {
    icon: BarChart2,
    title: "Kanban Topic Board",
    desc: "Organize topics across Pending, In Progress, Done, and Revision columns with drag-free status updates.",
  },
];

const FREE_FEATURES = [
  "3 subjects, 50 topics",
  "Basic progress tracking",
  "Study streak tracking",
  "Manual topic management",
];

const PRO_FEATURES = [
  "Unlimited subjects & topics",
  "AI PDF syllabus parsing",
  "AI study plan generation",
  "Smart topic recommendations",
  "Advanced analytics & charts",
  "Redis-backed reminders",
  "Priority support",
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Grid bg */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border max-w-6xl mx-auto">
        <div>
          <span className="font-mono font-semibold text-lg">Sylla</span>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest">AI SYLLABUS TRACKER</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="bg-primary text-primary-foreground text-sm rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors font-medium"
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 mb-6">
            <Sparkles size={12} className="text-primary" />
            <span className="font-mono text-xs text-primary">Powered by Google Gemini AI</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-semibold text-foreground leading-tight mb-5">
            Study smarter,<br />
            <span className="text-primary">not harder</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Upload your syllabus, let AI parse it into structured topics, generate study plans,
            and track every milestone — all in one minimal dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Start for free
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-3 border border-border rounded-lg"
            >
              View demo
            </button>
          </div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 rounded-2xl border border-border overflow-hidden shadow-2xl shadow-black/50"
        >
          <div className="bg-card/80 border-b border-border px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="font-mono text-xs text-muted-foreground mx-auto">sylla.app — Dashboard</span>
          </div>
          <div className="bg-card/40 p-6">
            {/* Mock dashboard */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "COMPLETION", value: "68%" },
                { label: "TOPICS DONE", value: "84" },
                { label: "STUDY STREAK", value: "🔥 12" },
                { label: "EXAM IN", value: "14d" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-3">
                  <p className="font-mono text-[9px] text-muted-foreground tracking-widest mb-2">{s.label}</p>
                  <p className="font-mono text-2xl font-semibold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm font-medium mb-3">Subject Progress</p>
                {[
                  { name: "Mathematics", pct: 78, color: "#22c55e" },
                  { name: "Physics", pct: 62, color: "#3b82f6" },
                  { name: "Chemistry", pct: 45, color: "#f97316" },
                  { name: "Computer Science", pct: 91, color: "#a855f7" },
                ].map((s) => (
                  <div key={s.name} className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{s.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{s.pct}%</span>
                    </div>
                    <div className="h-1 bg-secondary rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm font-medium mb-3">Today's Schedule</p>
                {[
                  { time: "08:00", name: "Linear Algebra — Eigenvalues", status: "Done", color: "text-primary" },
                  { time: "10:30", name: "Thermodynamics — Carnot Cycle", status: "Now", color: "text-orange-400" },
                  { time: "14:00", name: "Organic Chemistry — Mechanisms", status: "Later", color: "text-muted-foreground" },
                ].map((t) => (
                  <div key={t.time} className="flex items-center gap-2 mb-2.5">
                    <span className="font-mono text-[10px] text-muted-foreground w-9">{t.time}</span>
                    <span className="text-xs text-foreground flex-1 truncate">{t.name}</span>
                    <span className={`font-mono text-[9px] ${t.color}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-3">FEATURES</p>
          <h2 className="text-3xl font-semibold text-foreground">Everything you need to ace your exams</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <Icon size={15} className="text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-3">PRICING</p>
          <h2 className="text-3xl font-semibold text-foreground">Simple, transparent pricing</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={15} className="text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Free</h3>
            </div>
            <div className="mb-5">
              <span className="font-mono text-3xl font-semibold">₹0</span>
              <span className="text-muted-foreground text-sm"> forever</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Check size={12} className="text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-2.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              Get started free
            </button>
          </div>

          {/* Pro */}
          <div className="bg-card border border-primary/40 rounded-xl p-6 relative shadow-[0_0_40px_rgba(34,197,94,0.08)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground font-mono text-[10px] tracking-widest px-3 py-1 rounded-full">
                POPULAR
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={15} className="text-primary" />
              <h3 className="font-semibold text-foreground">Pro</h3>
            </div>
            <div className="mb-5">
              <span className="font-mono text-3xl font-semibold">₹199</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Check size={12} className="text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Start Pro trial
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono font-semibold text-sm">Sylla</span>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-0.5">AI SYLLABUS TRACKER</p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Built with React · Express · MongoDB · Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}
