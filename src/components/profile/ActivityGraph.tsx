import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const arDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
};

interface DayActivity {
  date: string;
  count: number;
}

export function ActivityGraph() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchActivity();
  }, [user]);

  const fetchActivity = async () => {
    if (!user) return;
    setLoading(true);

    // Get last 90 days
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 89);
    const startStr = start.toISOString().split("T")[0];

    // Fetch from multiple tables in parallel
    const [questionsRes, answersRes, checkinsRes] = await Promise.all([
      supabase.from("questions").select("created_at").eq("user_id", user.id).gte("created_at", startStr),
      supabase.from("answers").select("created_at").eq("user_id", user.id).gte("created_at", startStr),
      supabase.from("daily_checkins").select("checkin_date").eq("user_id", user.id).gte("checkin_date", startStr),
    ]);

    const dayMap: Record<string, number> = {};

    // Initialize all 90 days
    for (let i = 0; i < 90; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dayMap[d.toISOString().split("T")[0]] = 0;
    }

    // Count activities
    questionsRes.data?.forEach(q => {
      const day = q.created_at.split("T")[0];
      if (dayMap[day] !== undefined) dayMap[day]++;
    });
    answersRes.data?.forEach(a => {
      const day = a.created_at.split("T")[0];
      if (dayMap[day] !== undefined) dayMap[day]++;
    });
    checkinsRes.data?.forEach(c => {
      const day = c.checkin_date;
      if (dayMap[day] !== undefined) dayMap[day]++;
    });

    setActivities(Object.entries(dayMap).map(([date, count]) => ({ date, count })));
    setLoading(false);
  };

  const maxCount = Math.max(...activities.map(a => a.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "bg-secondary";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-primary/25";
    if (ratio <= 0.5) return "bg-primary/50";
    if (ratio <= 0.75) return "bg-primary/75";
    return "bg-primary";
  };

  const totalActivities = activities.reduce((sum, a) => sum + a.count, 0);
  const activeDays = activities.filter(a => a.count > 0).length;

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border-border/50 animate-pulse">
        <div className="h-6 bg-secondary rounded w-48 mb-4" />
        <div className="h-24 bg-secondary rounded" />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          النشاط خلال 90 يوم
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{totalActivities}</strong> نشاط</span>
          <span><strong className="text-foreground">{activeDays}</strong> يوم نشط</span>
        </div>
      </div>

      {/* Grid - 13 weeks x 7 days */}
      <div className="flex gap-[3px] overflow-x-auto pb-2" dir="ltr">
        <TooltipProvider delayDuration={100}>
          {Array.from({ length: 13 }, (_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx;
                const activity = activities[idx];
                if (!activity) return <div key={dayIdx} className="w-3 h-3" />;
                return (
                  <Tooltip key={dayIdx}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.003 }}
                        className={`w-3 h-3 rounded-[2px] ${getColor(activity.count)} transition-colors cursor-pointer hover:ring-2 hover:ring-primary/50`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="font-bold">{arDate(activity.date)}</div>
                      <div className="text-muted-foreground">
                        {activity.count === 0 ? "لا يوجد نشاط" : `${activity.count} نشاط`}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground" dir="ltr">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[2px] bg-secondary" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/25" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/50" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/75" />
        <div className="w-3 h-3 rounded-[2px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}
