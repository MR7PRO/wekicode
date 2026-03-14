import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Coins, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface PointEntry {
  id: string;
  type: "earn" | "spend";
  amount: number;
  description: string;
  date: string;
}

export function PointsLedger() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchPointsHistory();
  }, [user]);

  const fetchPointsHistory = async () => {
    if (!user) return;
    setLoading(true);

    const [checkinsRes, redemptionsRes, questionsRes, answersRes] = await Promise.all([
      supabase.from("daily_checkins").select("id, points_earned, checkin_date").eq("user_id", user.id).order("checkin_date", { ascending: false }).limit(20),
      supabase.from("reward_redemptions").select("id, points_spent, created_at, rewards(title)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("questions").select("id, created_at, title").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("answers").select("id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    const allEntries: PointEntry[] = [];

    checkinsRes.data?.forEach(c => {
      allEntries.push({
        id: `checkin-${c.id}`,
        type: "earn",
        amount: c.points_earned,
        description: "تسجيل حضور يومي",
        date: c.checkin_date,
      });
    });

    redemptionsRes.data?.forEach(r => {
      const rewardTitle = (r as any).rewards?.title || "مكافأة";
      allEntries.push({
        id: `redeem-${r.id}`,
        type: "spend",
        amount: r.points_spent,
        description: `استبدال: ${rewardTitle}`,
        date: r.created_at.split("T")[0],
      });
    });

    questionsRes.data?.forEach(q => {
      allEntries.push({
        id: `question-${q.id}`,
        type: "earn",
        amount: 5,
        description: `سؤال: ${q.title?.slice(0, 40) || "سؤال جديد"}`,
        date: q.created_at.split("T")[0],
      });
    });

    answersRes.data?.forEach(a => {
      allEntries.push({
        id: `answer-${a.id}`,
        type: "earn",
        amount: 10,
        description: "إجابة على سؤال",
        date: a.created_at.split("T")[0],
      });
    });

    // Sort by date descending
    allEntries.sort((a, b) => b.date.localeCompare(a.date));
    setEntries(allEntries.slice(0, 30));
    setLoading(false);
  };

  const totalEarned = entries.filter(e => e.type === "earn").reduce((s, e) => s + e.amount, 0);
  const totalSpent = entries.filter(e => e.type === "spend").reduce((s, e) => s + e.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Coins className="w-5 h-5 text-accent" />
        سجل النقاط
      </h3>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUp className="w-4 h-4 text-success" />
            <span className="text-sm text-success font-bold">مكتسبة</span>
          </div>
          <div className="text-2xl font-black text-foreground">+{totalEarned}</div>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDown className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive font-bold">مستهلكة</span>
          </div>
          <div className="text-2xl font-black text-foreground">-{totalSpent}</div>
        </div>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Coins className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا يوجد سجل نقاط بعد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  entry.type === "earn" ? "bg-success/10" : "bg-destructive/10"
                }`}>
                  {entry.type === "earn" ? (
                    <ArrowUp className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.description}</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
              </div>
              <span className={`font-bold text-sm ${
                entry.type === "earn" ? "text-success" : "text-destructive"
              }`}>
                {entry.type === "earn" ? "+" : "-"}{entry.amount}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
