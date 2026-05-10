import { Award, Star, Zap, Trophy, Target, Flame, Crown, Shield, Heart, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, forwardRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export interface BadgeTier {
  tier: number; // 1=I, 2=II, 3=III
  requirement: number;
  label: string; // I, II, III
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof badgeIcons;
  color: "primary" | "accent" | "success" | "warning";
  unlockedAt?: string;
  progress?: number;
  requirement: number;
  tiers?: BadgeTier[];
  category: "streak" | "answers" | "projects" | "learning" | "general";
}

export const badgeIcons = {
  award: Award,
  star: Star,
  zap: Zap,
  trophy: Trophy,
  target: Target,
  flame: Flame,
  crown: Crown,
  shield: Shield,
  heart: Heart,
  rocket: Rocket,
};

const tierLabels = ["I", "II", "III"];
const tierColors: Record<number, string> = {
  1: "from-amber-600/80 to-amber-800/80", // Bronze
  2: "from-slate-300/80 to-slate-500/80",  // Silver
  3: "from-yellow-300/80 to-amber-500/80", // Gold
};

// Streak badges
export const streakBadges: Badge[] = [
  { id: "streak_3", name: "بداية قوية", description: "سجل حضور 3 أيام متتالية", icon: "flame", color: "primary", requirement: 3, category: "streak",
    tiers: [{ tier: 1, requirement: 3, label: "I" }, { tier: 2, requirement: 7, label: "II" }, { tier: 3, requirement: 14, label: "III" }] },
  { id: "streak_7", name: "أسبوع كامل", description: "سجل حضور 7 أيام متتالية", icon: "flame", color: "accent", requirement: 7, category: "streak",
    tiers: [{ tier: 1, requirement: 7, label: "I" }, { tier: 2, requirement: 14, label: "II" }, { tier: 3, requirement: 30, label: "III" }] },
  { id: "streak_14", name: "المثابر", description: "سجل حضور 14 يوم متتالي", icon: "flame", color: "success", requirement: 14, category: "streak" },
  { id: "streak_30", name: "البطل الشهري", description: "سجل حضور 30 يوم متتالي", icon: "trophy", color: "warning", requirement: 30, category: "streak" },
  { id: "streak_60", name: "النجم الصاعد", description: "سجل حضور 60 يوم متتالي", icon: "star", color: "accent", requirement: 60, category: "streak" },
  { id: "streak_90", name: "الأسطورة", description: "سجل حضور 90 يوم متتالي", icon: "crown", color: "warning", requirement: 90, category: "streak" },
  { id: "streak_100", name: "المائة", description: "سجل حضور 100 يوم متتالي", icon: "award", color: "warning", requirement: 100, category: "streak" },
];

export const allBadges: Badge[] = [
  { id: "first_answer", name: "أول إجابة", description: "أجب على أول سؤال", icon: "star", color: "primary", requirement: 1, category: "answers",
    tiers: [{ tier: 1, requirement: 1, label: "I" }, { tier: 2, requirement: 5, label: "II" }, { tier: 3, requirement: 10, label: "III" }] },
  { id: "helper", name: "المساعد", description: "أجب على 10 أسئلة", icon: "heart", color: "accent", requirement: 10, category: "answers",
    tiers: [{ tier: 1, requirement: 10, label: "I" }, { tier: 2, requirement: 25, label: "II" }, { tier: 3, requirement: 50, label: "III" }] },
  { id: "expert", name: "الخبير", description: "أجب على 50 سؤال", icon: "trophy", color: "success", requirement: 50, category: "answers",
    tiers: [{ tier: 1, requirement: 50, label: "I" }, { tier: 2, requirement: 100, label: "II" }, { tier: 3, requirement: 200, label: "III" }] },
  { id: "first_project", name: "أول مشروع", description: "أكمل أول مشروع", icon: "rocket", color: "primary", requirement: 1, category: "projects",
    tiers: [{ tier: 1, requirement: 1, label: "I" }, { tier: 2, requirement: 3, label: "II" }, { tier: 3, requirement: 5, label: "III" }] },
  { id: "freelancer", name: "المستقل", description: "أكمل 5 مشاريع", icon: "zap", color: "accent", requirement: 5, category: "projects",
    tiers: [{ tier: 1, requirement: 5, label: "I" }, { tier: 2, requirement: 10, label: "II" }, { tier: 3, requirement: 20, label: "III" }] },
  { id: "pro_freelancer", name: "المستقل المحترف", description: "أكمل 20 مشروع", icon: "crown", color: "warning", requirement: 20, category: "projects" },
  { id: "learner", name: "المتعلم", description: "أكمل أول دورة", icon: "target", color: "primary", requirement: 1, category: "learning",
    tiers: [{ tier: 1, requirement: 1, label: "I" }, { tier: 2, requirement: 3, label: "II" }, { tier: 3, requirement: 5, label: "III" }] },
  { id: "scholar", name: "العالم", description: "أكمل 10 دورات", icon: "shield", color: "success", requirement: 10, category: "learning",
    tiers: [{ tier: 1, requirement: 10, label: "I" }, { tier: 2, requirement: 20, label: "II" }, { tier: 3, requirement: 50, label: "III" }] },
  ...streakBadges,
  { id: "legend", name: "الأسطورة", description: "اوصل للمستوى 10", icon: "award", color: "warning", requirement: 10, category: "general",
    tiers: [{ tier: 1, requirement: 10, label: "I" }, { tier: 2, requirement: 20, label: "II" }, { tier: 3, requirement: 50, label: "III" }] },
];

// Helper: get current tier for a badge based on progress
export function getBadgeTier(badge: Badge, currentProgress: number): number {
  if (!badge.tiers) return currentProgress >= badge.requirement ? 1 : 0;
  let tier = 0;
  for (const t of badge.tiers) {
    if (currentProgress >= t.requirement) tier = t.tier;
  }
  return tier;
}

// Helper: get next tier requirement
export function getNextTierRequirement(badge: Badge, currentTier: number): number | null {
  if (!badge.tiers) return currentTier >= 1 ? null : badge.requirement;
  const next = badge.tiers.find(t => t.tier === currentTier + 1);
  return next ? next.requirement : null;
}

// Helper function to check earned streak badges
export function getEarnedStreakBadges(currentStreak: number): string[] {
  return streakBadges
    .filter(badge => currentStreak >= badge.requirement)
    .map(badge => badge.id);
}

// Helper function to get newly earned badges
export function getNewlyEarnedBadge(currentStreak: number, existingBadges: string[]): Badge | null {
  const earnedBadge = streakBadges.find(
    badge => currentStreak >= badge.requirement && !existingBadges.includes(badge.id)
  );
  return earnedBadge || null;
}

interface BadgeUnlockModalProps {
  badge: Badge | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeUnlockModal({ badge, isOpen, onClose }: BadgeUnlockModalProps) {
  useEffect(() => {
    if (isOpen) {
      const audio = new Audio("/badge-unlock.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!badge) return null;

  const Icon = badgeIcons[badge.icon];
  const colorClasses = {
    primary: "from-primary to-primary/60 text-primary shadow-glow",
    accent: "from-accent to-accent/60 text-accent shadow-accent",
    success: "from-success to-success/60 text-success",
    warning: "from-warning to-warning/60 text-warning",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="glass rounded-3xl p-8 border-2 border-accent/50 text-center max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-accent"
                  initial={{ x: "50%", y: "50%", scale: 0 }}
                  animate={{ x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%`, scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, delay: i * 0.05, ease: "easeOut" }}
                />
              ))}
            </div>
            <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="text-sm font-medium text-accent mb-4">
              🎉 تهانينا!
            </motion.div>
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${colorClasses[badge.color]} flex items-center justify-center mx-auto mb-4`}
            >
              <Icon className="w-12 h-12" />
            </motion.div>
            <motion.h3 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-foreground mb-2">
              {badge.name}
            </motion.h3>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-muted-foreground">
              {badge.description}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="mt-6 text-xs text-muted-foreground">
              اضغط للإغلاق
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BadgeDisplayProps {
  badges: string[];
  showAll?: boolean;
  currentStreak?: number;
  stats?: { answers: number; projects: number; courses: number; level: number };
}

export const BadgeDisplay = forwardRef<HTMLDivElement, BadgeDisplayProps>(
  function BadgeDisplay({ badges, showAll = false, currentStreak = 0, stats }, ref) {
    const unlockedBadges = allBadges.filter(b => badges.includes(b.id));
    const lockedBadges = allBadges.filter(b => !badges.includes(b.id));
    
    const displayBadges = showAll ? allBadges : unlockedBadges.slice(0, 6);

    // Calculate progress for each badge
    const getProgress = (badge: Badge): number => {
      if (badge.category === "streak") return currentStreak;
      if (!stats) return badges.includes(badge.id) ? badge.requirement : 0;
      switch (badge.category) {
        case "answers": return stats.answers;
        case "projects": return stats.projects;
        case "learning": return stats.courses;
        case "general": return stats.level;
        default: return 0;
      }
    };

    return (
      <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <BadgeDialogHost badges={badges} currentStreak={currentStreak} stats={stats} />
        {displayBadges.map((badge) => {
          const Icon = badgeIcons[badge.icon];
          const isUnlocked = badges.includes(badge.id);
          const progress = getProgress(badge);
          const currentTier = getBadgeTier(badge, progress);
          const nextReq = getNextTierRequirement(badge, currentTier);
          const currentTierReq = badge.tiers?.[Math.max(currentTier - 1, 0)]?.requirement || badge.requirement;
          const progressToNext = nextReq ? Math.min(((progress - (currentTier > 0 ? currentTierReq : 0)) / (nextReq - (currentTier > 0 ? currentTierReq : 0))) * 100, 100) : 100;
          
          const colorClasses = {
            primary: "from-primary/20 to-primary/5 border-primary/30 text-primary",
            accent: "from-accent/20 to-accent/5 border-accent/30 text-accent",
            success: "from-success/20 to-success/5 border-success/30 text-success",
            warning: "from-warning/20 to-warning/5 border-warning/30 text-warning",
          };

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => window.dispatchEvent(new CustomEvent("badge:open", { detail: badge.id }))}
              className={`relative p-4 rounded-xl border text-center transition-all cursor-pointer ${
                isUnlocked 
                  ? `bg-gradient-to-b ${colorClasses[badge.color]}` 
                  : "bg-secondary/50 border-border/50"
              }`}
            >
              {/* Tier badge */}
              {badge.tiers && currentTier > 0 && (
                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${tierColors[currentTier]} flex items-center justify-center border-2 border-background shadow-md z-10`}>
                  <span className="text-[10px] font-black text-white">{tierLabels[currentTier - 1]}</span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                isUnlocked ? "bg-background/20" : "bg-secondary"
              }`}>
                <Icon className={`w-6 h-6 ${isUnlocked ? "" : "text-muted-foreground opacity-50"}`} />
              </div>
              <div className={`text-xs font-bold truncate mb-1 ${isUnlocked ? "" : "text-muted-foreground"}`}>
                {badge.name}
              </div>

              {/* Progress bar */}
              {showAll && (
                <div className="mt-2 space-y-1">
                  <Progress value={isUnlocked ? (nextReq ? progressToNext : 100) : Math.min((progress / badge.requirement) * 100, 100)} 
                    className="h-1.5" />
                  <div className="text-[10px] text-muted-foreground">
                    {isUnlocked && !nextReq ? (
                      <span className="text-success font-bold">مكتمل ✓</span>
                    ) : (
                      <span>{Math.min(progress, nextReq || badge.requirement)} / {nextReq || badge.requirement}</span>
                    )}
                  </div>
                  {/* Tier dots */}
                  {badge.tiers && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {badge.tiers.map((t) => (
                        <div key={t.tier} className={`w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center ${
                          currentTier >= t.tier
                            ? `bg-gradient-to-br ${tierColors[t.tier]} text-white`
                            : "bg-secondary border border-border text-muted-foreground"
                        }`}>
                          {t.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description on hover - only in showAll */}
              {showAll && (
                <div className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">
                  {badge.description}
                </div>
              )}

              {!isUnlocked && !showAll && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center">
                    <span className="text-xs">🔒</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }
);

BadgeDisplay.displayName = "BadgeDisplay";

function BadgeDialogHost({ badges, currentStreak = 0, stats }: { badges: string[]; currentStreak?: number; stats?: { answers: number; projects: number; courses: number; level: number } }) {
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setOpenId(id);
    };
    window.addEventListener("badge:open", handler);
    return () => window.removeEventListener("badge:open", handler);
  }, []);

  const badge = allBadges.find(b => b.id === openId) || null;
  if (!badge) return <Dialog open={false} onOpenChange={() => setOpenId(null)}><DialogContent /></Dialog>;

  const Icon = badgeIcons[badge.icon];
  const isUnlocked = badges.includes(badge.id);
  const progress = (() => {
    if (badge.category === "streak") return currentStreak;
    if (!stats) return isUnlocked ? badge.requirement : 0;
    switch (badge.category) {
      case "answers": return stats.answers;
      case "projects": return stats.projects;
      case "learning": return stats.courses;
      case "general": return stats.level;
      default: return 0;
    }
  })();
  const currentTier = getBadgeTier(badge, progress);
  const nextReq = getNextTierRequirement(badge, currentTier);

  const colorMap: Record<string, string> = {
    primary: "from-primary to-primary/60 text-primary-foreground",
    accent: "from-accent to-accent/60 text-accent-foreground",
    success: "from-success to-success/60 text-success-foreground",
    warning: "from-warning to-warning/60 text-warning-foreground",
  };

  return (
    <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorMap[badge.color]} mx-auto flex items-center justify-center mb-3`}>
            <Icon className="w-8 h-8" />
          </div>
          <DialogTitle className="text-center text-xl">{badge.name}</DialogTitle>
          <DialogDescription className="text-center">{badge.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="text-sm font-bold text-foreground">شروط الحصول عليها:</div>
          {badge.tiers ? (
            <ul className="space-y-2">
              {badge.tiers.map(t => {
                const reached = currentTier >= t.tier;
                return (
                  <li key={t.tier} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${reached ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                    <span>المستوى {t.label}</span>
                    <span className="font-bold">{t.requirement.toLocaleString()} {reached ? "✓" : ""}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-lg bg-secondary px-3 py-2 text-sm">
              يتطلب الوصول إلى <strong className="text-foreground">{badge.requirement}</strong>
            </div>
          )}
          <div className="pt-2">
            <Progress value={Math.min((progress / (nextReq || badge.requirement)) * 100, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1.5 text-end">
              {Math.min(progress, nextReq || badge.requirement).toLocaleString()} / {(nextReq || badge.requirement).toLocaleString()}
            </div>
          </div>
          {isUnlocked && !nextReq && (
            <div className="text-center text-success font-bold">🎉 مكتمل بالكامل</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
