import { Coins, TrendingUp, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ProgressWidget() {
  const { profile, user } = useAuth();

  if (!user || !profile) return null;

  const points = profile.points ?? 0;

  // Level thresholds: index = level, value = min points required to reach that level
  const LEVEL_THRESHOLDS = [0, 0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
  const MAX_LEVEL = LEVEL_THRESHOLDS.length - 1;

  // Derive level from actual points so the bar always reflects reality,
  // even if the stored profile.level lags behind.
  let derivedLevel = 1;
  for (let i = 1; i <= MAX_LEVEL; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) derivedLevel = i;
  }
  const level = Math.max(profile.level ?? 1, derivedLevel);

  const isMaxLevel = level >= MAX_LEVEL;
  const currentLevelPoints = LEVEL_THRESHOLDS[Math.min(level, MAX_LEVEL)];
  const nextLevelPoints = isMaxLevel
    ? currentLevelPoints
    : LEVEL_THRESHOLDS[level + 1];
  const pointsNeeded = Math.max(0, nextLevelPoints - currentLevelPoints);
  const progressInLevel = Math.max(0, Math.min(points - currentLevelPoints, pointsNeeded));
  const remainingToNext = Math.max(0, nextLevelPoints - points);
  const progressPercentage = isMaxLevel
    ? 100
    : pointsNeeded > 0
      ? Math.min((progressInLevel / pointsNeeded) * 100, 100)
      : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
          {/* Level badge */}
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-sm font-bold text-primary-foreground">{level}</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-accent flex items-center justify-center">
              <Star className="w-2.5 h-2.5 text-accent-foreground fill-accent-foreground" />
            </div>
          </div>

          {/* Progress info */}
          <div className="hidden lg:flex flex-col min-w-[80px]">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>المستوى {level}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Points */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-accent">
            <Coins className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-bold text-accent-foreground">{points.toLocaleString()}</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="p-4 max-w-xs">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">تقدمك</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المستوى الحالي</span>
              <span className="font-bold text-primary">{level}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">النقاط</span>
              <span className="font-bold text-accent">{points.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">للمستوى التالي</span>
              <span className="font-medium text-foreground">
                {isMaxLevel ? "أعلى مستوى" : `${remainingToNext.toLocaleString()} نقطة`}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>
                {isMaxLevel
                  ? `${points.toLocaleString()} نقطة`
                  : `${progressInLevel.toLocaleString()} / ${pointsNeeded.toLocaleString()}`}
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-primary rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}