import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { WeeklyData } from "@/types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="font-mono text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-sm text-foreground font-medium">{payload[0].value}h</p>
      </div>
    );
  }
  return null;
};

export function WeeklyHoursChart({ data }: { data: WeeklyData | null }) {
  const chartData = data?.data.map((d) => ({
    day: d.day,
    hours: parseFloat(d.hours),
  })) ?? [];

  const maxHours = Math.max(...chartData.map((d) => d.hours), 1);
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Weekly Study Hours</h3>
        <span className="font-mono text-xs text-muted-foreground">This week</span>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={20} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(0 0% 50%)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(0 0% 14%)" }} />
            <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.day}
                  fill={entry.day === today ? "hsl(142 70% 45%)" : "hsl(0 0% 16%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">Total this week</span>
        <span className="font-mono text-sm font-semibold text-foreground">
          {data?.totalHours ?? 0} hrs
        </span>
      </div>
    </div>
  );
}
