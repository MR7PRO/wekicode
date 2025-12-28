import { Award, Star, Zap, Trophy, Target, Flame, Crown, Shield, Heart, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, forwardRef } from "react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof badgeIcons;
  color: "primary" | "accent" | "success" | "warning";
  unlockedAt?: string;
  progress?: number;
  requirement: number;
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

// Streak badges
export const streakBadges: Badge[] = [
  { id: "streak_3", name: "بداية قوية", description: "سجل حضور 3 أيام متتالية", icon: "flame", color: "primary", requirement: 3 },
  { id: "streak_7", name: "أسبوع كامل", description: "سجل حضور 7 أيام متتالية", icon: "flame", color: "accent", requirement: 7 },
  { id: "streak_14", name: "المثابر", description: "سجل حضور 14 يوم متتالي", icon: "flame", color: "success", requirement: 14 },
  { id: "streak_30", name: "البطل الشهري", description: "سجل حضور 30 يوم متتالي", icon: "trophy", color: "warning", requirement: 30 },
  { id: "streak_60", name: "النجم الصاعد", description: "سجل حضور 60 يوم متتالي", icon: "star", color: "accent", requirement: 60 },
  { id: "streak_90", name: "الأسطورة", description: "سجل حضور 90 يوم متتالي", icon: "crown", color: "warning", requirement: 90 },
  { id: "streak_100", name: "المائة", description: "سجل حضور 100 يوم متتالي", icon: "award", color: "warning", requirement: 100 },
];

export const allBadges: Badge[] = [
  { id: "first_answer", name: "أول إجابة", description: "أجب على أول سؤال", icon: "star", color: "primary", requirement: 1 },
  { id: "helper", name: "المساعد", description: "أجب على 10 أسئلة", icon: "heart", color: "accent", requirement: 10 },
  { id: "expert", name: "الخبير", description: "أجب على 50 سؤال", icon: "trophy", color: "success", requirement: 50 },
  { id: "first_project", name: "أول مشروع", description: "أكمل أول مشروع", icon: "rocket", color: "primary", requirement: 1 },
  { id: "freelancer", name: "المستقل", description: "أكمل 5 مشاريع", icon: "zap", color: "accent", requirement: 5 },
  { id: "pro_freelancer", name: "المستقل المحترف", description: "أكمل 20 مشروع", icon: "crown", color: "warning", requirement: 20 },
  { id: "learner", name: "المتعلم", description: "أكمل أول دورة", icon: "target", color: "primary", requirement: 1 },
  { id: "scholar", name: "العالم", description: "أكمل 10 دورات", icon: "shield", color: "success", requirement: 10 },
  ...streakBadges,
  { id: "legend", name: "الأسطورة", description: "اصل للمستوى 10", icon: "award", color: "warning", requirement: 10 },
];

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
      // Play unlock sound
      const audio = new Audio("/badge-unlock.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
      
      // Auto close after 4 seconds
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
            {/* Confetti-like particles */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-accent"
                  initial={{ 
                    x: "50%", 
                    y: "50%",
                    scale: 0 
                  }}
                  animate={{ 
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-sm font-medium text-accent mb-4"
            >
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

            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              {badge.name}
            </motion.h3>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              {badge.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-xs text-muted-foreground"
            >
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
}

export const BadgeDisplay = forwardRef<HTMLDivElement, BadgeDisplayProps>(
  function BadgeDisplay({ badges, showAll = false }, ref) {
    const unlockedBadges = allBadges.filter(b => badges.includes(b.id));
    const lockedBadges = allBadges.filter(b => !badges.includes(b.id));
    
    const displayBadges = showAll ? [...unlockedBadges, ...lockedBadges] : unlockedBadges.slice(0, 6);

    return (
      <div ref={ref} className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {displayBadges.map((badge) => {
          const Icon = badgeIcons[badge.icon];
          const isUnlocked = badges.includes(badge.id);
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
              whileHover={{ scale: 1.05 }}
              className={`relative p-3 rounded-xl border text-center transition-all cursor-pointer ${
                isUnlocked 
                  ? `bg-gradient-to-b ${colorClasses[badge.color]}` 
                  : "bg-secondary/50 border-border/50 opacity-50 grayscale"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                isUnlocked ? "bg-background/20" : "bg-secondary"
              }`}>
                <Icon className={`w-5 h-5 ${isUnlocked ? "" : "text-muted-foreground"}`} />
              </div>
              <div className={`text-xs font-medium truncate ${isUnlocked ? "" : "text-muted-foreground"}`}>
                {badge.name}
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
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
