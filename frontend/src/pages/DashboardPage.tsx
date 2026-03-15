import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, BookOpen, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardData, WeeklyData, StreakData } from "@/types";
import { WeeklyHoursChart } from "@/components/dashboard/WeeklyHoursChart";
import { SubjectProgressList } from "@/components/dashboard/SubjectProgressList";
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { StudyStreakGrid } from "@/components/dashboard/StudyStreakGrid";
import { PageHeader } from "@/components/ui/page-header";
import { onSessionChanged } from "@/lib/sessionEvents";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [dashRes, weekRes, streakRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/sessions/weekly"),
        api.get("/sessions/streak"),
      ]);
      setData(dashRes.data);
      setWeekly(weekRes.data);
      setStreak(streakRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return onSessionChanged(() => {
      load();
    });
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "COMPLETION",
      value: `${data?.completion ?? 0}%`,
      sub: null,
      progress: data?.completion ?? 0,
      icon: null,
    },
    {
      label: "TOPICS DONE",
      value: data?.doneTopics ?? 0,
      sub: `of ${data?.totalTopics ?? 0} total`,
      icon: null,
    },
    {
      label: "STUDY STREAK",
      value: streak?.streak ?? 0,
      sub: "days in a row",
      icon: <Flame size={16} className="text-orange-400" />,
    },
    {
      label: "EXAM IN",
      value: data?.upcomingExam ? `${data.upcomingExam.daysLeft}d` : "—",
      sub: data?.upcomingExam?.name ?? "No upcoming exam",
      accent: true,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader title="Dashboard" actions={
        <button
          onClick={() => load()}
          className="font-mono text-xs border border-border rounded-lg px-4 py-2 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Sync
        </button>
      } />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">
              {stat.label}
            </p>
            <div className="flex items-center gap-2">
              {stat.icon}
              <span
                className={`font-mono text-3xl font-semibold ${
                  (stat as any).accent ? "text-orange-400" : "text-foreground"
                }`}
              >
                {stat.value}
              </span>
            </div>
            {stat.sub && (
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            )}
            {(stat as any).progress !== undefined && (
              <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat as any).progress}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <TodaySchedule topics={data?.todayTopics ?? []} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <WeeklyHoursChart data={weekly} />
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <SubjectProgressList subjects={data?.subjectProgress ?? []} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <StudyStreakGrid streak={streak} />
        </motion.div>
      </div>
    </div>
  );
}
