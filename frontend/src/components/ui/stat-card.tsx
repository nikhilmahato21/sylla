import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: boolean;
  progress?: number;
  progressColor?: string;
  delay?: number;
  className?: string;
}

export function StatCard({
  label, value, sub, icon, accent, progress, progressColor, delay = 0, className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn("bg-card border border-border rounded-xl p-4", className)}
    >
      <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">{label}</p>
      <div className="flex items-center gap-2">
        {icon}
        <span className={cn("font-mono text-3xl font-semibold", accent ? "text-orange-400" : "text-foreground")}>
          {value}
        </span>
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: progressColor || "hsl(142 70% 45%)" }}
          />
        </div>
      )}
    </motion.div>
  );
}
