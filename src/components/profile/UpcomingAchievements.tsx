import { Target, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { allBadges, badgeIcons, getBadgeTier, getNextTierRequirement, type Badge } from "@/components/badges/BadgeSystem";
import { computeLevelInfo, LEVEL_THRESHOLDS } from "@/lib/leveling";

interface Props {
  badges: string[];
  currentStreak: number;
  stats: { answers: number; projects: number; courses: number; level: number };
  points: number;
}

interface UpcomingItem {
  key: string;
  type: "badge" | "level";
  title: string;
  description: string;
  current: number;
  target: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function getBadgeProgress(badge: Badge, props: Props): number {
  if (badge.category === "streak") return props.currentStreak;
  switch (badge.category) {
    case "answers": return props.stats.answers;
    case "projects": return props.stats.projects;
    case "learning": return props.stats.courses;
    case "general": return props.stats.level;
    default: return 0;
  }
}

export function UpcomingAchievements({ badges, currentStreak, stats, points }: Props) {
  const upcoming: UpcomingItem[] = [];

  // Next level
  const lvl = computeLevelInfo(points);
  if (!lvl.isMaxLevel) {
    upcoming.push({
      key: `level-${lvl.level + 1}`,
      type: "level",
      title: `المستوى ${lvl.level + 1}`,
      description: `ارفع نقاطك للوصول إلى المستوى التالي`,
      current: points,
      target: LEVEL_THRESHOLDS[lvl.level + 1],
      icon: Target,
      color: "primary",
    });
  }

  // Next badges (or next tier)
  for (const badge of allBadges) {
    const progress = getBadgeProgress(badge, { badges, currentStreak, stats, points });
    const currentTier = getBadgeTier(badge, progress);
    const nextReq = getNextTierRequirement(badge, currentTier);
    if (!nextReq) continue;
    if (progress >= nextReq) continue;
    upcoming.push({
      key: badge.id,
      type: "badge",
      title: badge.name,
      description: badge.description,
      current: progress,
      target: nextReq,
      icon: badgeIcons[badge.icon],
      color: badge.color,
    });
  }

  const top3 = upcoming
    .map(u => ({ ...u, remaining: u.target - u.current }))
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6 border-border/50">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <ChevronLeft className="w-5 h-5 text-accent" />
        إنجازات قادمة
      </h3>
      <div className="grid sm:grid-cols-3 gap-4">
        {top3.map((item, i) => {
          const pct = Math.min((item.current / item.target) * 100, 100);
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-4 rounded-xl bg-gradient-to-br from-${item.color}/10 to-${item.color}/5 border border-${item.color}/20`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg bg-${item.color}/20 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${item.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-foreground text-sm truncate">{item.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    باقي <strong className="text-foreground">{(item.target - item.current).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
              <Progress value={pct} className="h-1.5" />
              <div className="text-[10px] text-muted-foreground mt-1.5 text-end">
                {item.current.toLocaleString()} / {item.target.toLocaleString()}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
