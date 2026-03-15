import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { onSessionChanged } from "@/lib/sessionEvents";

export function ProgressPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [subRes, weekRes, streakRes] = await Promise.all([
        api.get("/subjects"),
        api.get("/sessions/weekly"),
        api.get("/sessions/streak"),
      ]);
      setSubjects(subRes.data);
      setWeekly(weekRes.data);
      setStreak(streakRes.data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    return onSessionChanged(() => {
      load();
    });
  }, []);

  const radialData = subjects.map((s) => ({
    name: s.name,
    completion: s.completion,
    fill: s.color,
  }));

  const weeklyChartData = weekly?.data.map((d: any) => ({
    day: d.day,
    hours: parseFloat(d.hours),
  })) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <PageHeader title="Progress" subtitle="Track your study performance" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject radial chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Subject Completion</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="20%"
                  outerRadius="90%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="completion"
                    background={{ fill: "hsl(0 0% 12%)" }}
                    cornerRadius={4}
                  />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
                          <p className="text-foreground font-medium">{payload[0].payload.name}</p>
                          <p className="font-mono text-muted-foreground">{payload[0].value}%</p>
                        </div>
                      ) : null
                    }
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-muted-foreground flex-1">{s.name}</span>
                  <span className="font-mono text-xs text-foreground">{s.completion}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly area chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Study Hours This Week</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142 70% 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142 70% 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(0 0% 14%)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(0 0% 50%)", fontSize: 11, fontFamily: "IBM Plex Mono" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0 0% 50%)", fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.[0] ? (
                        <div className="bg-card border border-border rounded-lg px-3 py-2">
                          <p className="font-mono text-xs text-muted-foreground">{label}</p>
                          <p className="font-mono text-sm text-foreground">{payload[0].value}h</p>
                        </div>
                      ) : null
                    }
                  />
                  <Area type="monotone" dataKey="hours" stroke="hsl(142 70% 45%)" fill="url(#hoursGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total this week</span>
              <span className="font-mono text-sm font-semibold text-foreground">{weekly?.totalHours ?? 0} hrs</span>
            </div>
          </div>

          {/* Streak stats */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Streak Overview</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "CURRENT", value: `${streak?.streak ?? 0}`, unit: "days" },
                { label: "ACTIVE DAYS", value: streak?.dates?.length ?? 0, unit: "total" },
                { label: "COMPLETION", value: subjects.length ? Math.round(subjects.reduce((sum: number, s: any) => sum + s.completion, 0) / subjects.length) : 0, unit: "%" },
              ].map((stat) => (
                <div key={stat.label} className="bg-secondary rounded-lg p-3 text-center">
                  <p className="font-mono text-[9px] text-muted-foreground tracking-wider mb-1">{stat.label}</p>
                  <p className="font-mono text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{stat.unit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subject breakdown table */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Subject Breakdown</h3>
            <div className="space-y-3">
              {subjects.map((s) => (
                <div key={s.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-foreground">{s.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {s.completedTopics}/{s.totalTopics}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.completion}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
