"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { IconLoader2, IconCalendar, IconClock, IconTrendingUp } from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";

interface VoteTimestamp {
  created_at: string;
}

interface AnalyticsDashboardProps {
  pollId: string;
  totalVoters?: number;
}

export default function AnalyticsDashboard({
  pollId,
}: AnalyticsDashboardProps) {
  const [votes, setVotes] = useState<VoteTimestamp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVoteTimestamps = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("votes")
        .select("created_at")
        .eq("poll_id", pollId)
        .order("created_at", { ascending: true });

      setVotes(data || []);
      setIsLoading(false);
    };

    loadVoteTimestamps();
  }, [pollId]);

  // Votes over time (daily buckets)
  const dailyData = useMemo(() => {
    if (votes.length === 0) return [];

    const buckets: Record<string, number> = {};
    votes.forEach((v) => {
      const day = new Date(v.created_at).toISOString().slice(0, 10);
      buckets[day] = (buckets[day] || 0) + 1;
    });

    const entries = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([date, count]) => ({ date, count }));
  }, [votes]);

  // Time-of-day distribution (24 hour buckets)
  const hourlyData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
    }));
    votes.forEach((v) => {
      const hour = new Date(v.created_at).getHours();
      buckets[hour].count++;
    });
    return buckets;
  }, [votes]);

  // Day-of-week distribution
  const weekdayData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = days.map((name) => ({ name, count: 0 }));
    votes.forEach((v) => {
      const day = new Date(v.created_at).getDay();
      buckets[day].count++;
    });
    return buckets;
  }, [votes]);

  // Engagement metrics
  const metrics = useMemo(() => {
    if (votes.length === 0) return null;

    const timestamps = votes.map((v) => new Date(v.created_at).getTime());
    const first = Math.min(...timestamps);
    const last = Math.max(...timestamps);
    const spanDays = Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));
    const avgPerDay = (votes.length / spanDays).toFixed(1);

    // Peak hour
    const maxHour = hourlyData.reduce((max, h) =>
      h.count > max.count ? h : max,
    );

    // Peak day
    const maxDay = weekdayData.reduce((max, d) =>
      d.count > max.count ? d : max,
    );

    return {
      avgPerDay,
      peakHour: `${maxHour.hour.toString().padStart(2, "0")}:00`,
      peakDay: maxDay.name,
      spanDays,
    };
  }, [votes, hourlyData, weekdayData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (votes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No vote data available for analytics.
      </div>
    );
  }

  const maxDaily = Math.max(...dailyData.map((d) => d.count), 1);
  const maxHourly = Math.max(...hourlyData.map((h) => h.count), 1);
  const maxWeekday = Math.max(...weekdayData.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="rounded-xl border bg-card p-4 text-center"
          >
            <IconTrendingUp size={18} className="text-emerald-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-foreground">{metrics.avgPerDay}</div>
            <div className="text-xs text-muted-foreground">Votes/Day</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border bg-card p-4 text-center"
          >
            <IconClock size={18} className="text-blue-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-foreground">{metrics.peakHour}</div>
            <div className="text-xs text-muted-foreground">Peak Hour</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border bg-card p-4 text-center"
          >
            <IconCalendar size={18} className="text-purple-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-foreground">{metrics.peakDay}</div>
            <div className="text-xs text-muted-foreground">Most Active Day</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border bg-card p-4 text-center"
          >
            <IconCalendar size={18} className="text-amber-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-foreground">{metrics.spanDays}</div>
            <div className="text-xs text-muted-foreground">Days Active</div>
          </motion.div>
        </div>
      )}

      {/* Votes Over Time */}
      <div className="rounded-xl border bg-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4">
          Votes Over Time
        </h4>
        <div className="flex items-end gap-1 h-32">
          {dailyData.map((d, i) => (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.count / maxDaily) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                className="w-full min-h-[4px] bg-emerald-500 rounded-t-sm hover:bg-emerald-400 transition-colors"
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border whitespace-nowrap">
                  {d.date}: {d.count} vote{d.count !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
        {dailyData.length > 1 && (
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
            <span>{dailyData[0].date}</span>
            <span>{dailyData[dailyData.length - 1].date}</span>
          </div>
        )}
      </div>

      {/* Time of Day Heatmap */}
      <div className="rounded-xl border bg-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4">
          Time of Day Distribution
        </h4>
        <div className="grid grid-cols-12 gap-1">
          {hourlyData.map((h) => {
            const intensity = h.count / maxHourly;
            return (
              <div key={h.hour} className="flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full aspect-square rounded-sm transition-colors"
                  style={{
                    backgroundColor:
                      h.count === 0
                        ? "hsl(var(--muted))"
                        : `rgba(16, 185, 129, ${0.15 + intensity * 0.85})`,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">
                  {h.hour.toString().padStart(2, "0")}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                  <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border whitespace-nowrap">
                    {h.hour}:00 — {h.count} vote{h.count !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day of Week */}
      <div className="rounded-xl border bg-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4">
          Day of Week
        </h4>
        <div className="space-y-2">
          {weekdayData.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-8 shrink-0">
                {d.name}
              </span>
              <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.count / maxWeekday) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-emerald-500/70 rounded-md min-w-[2px]"
                />
              </div>
              <span className="text-xs font-medium text-foreground w-8 text-right">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
