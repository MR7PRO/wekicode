import { getLevelPerk, getNextLevelPerk, LevelPerk } from "@/lib/levelPerks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { computeLevelInfo } from "@/lib/leveling";
import { Crown } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  points?: number;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LevelBadge({ level, points, showTooltip = true, size = "md" }: LevelBadgeProps) {
  const perk = getLevelPerk(level);
  const nextPerk = getNextLevelPerk(level);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const badge = (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClasses[size]}`} style={{ ...parseStyle(perk.nameColorStyle) }}>
      <span>{perk.badge}</span>
      <span>{perk.title}</span>
    </span>
  );

  if (!showTooltip) return badge;

  const info = computeLevelInfo(points ?? 0, level);
  const progressToNext = info.progressPercentage;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="bottom" className="p-4 max-w-xs">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-accent" />
            <span className="font-bold">المستوى {level} — {perk.title}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">المزايا الحالية:</p>
            <ul className="space-y-1">
              {perk.perks.map((p, i) => (
                <li key={i} className="flex items-center gap-1">
                  <span className="text-primary">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
          {nextPerk && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">
                المستوى التالي: {nextPerk.badge} {nextPerk.title} (المستوى {nextPerk.level})
              </p>
              <Progress value={progressToNext} className="h-1.5" />
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/** Renders a username with level-based color styling */
export function StyledUsername({ name, level, className = "" }: { name: string; level: number; className?: string }) {
  const perk = getLevelPerk(level);
  return (
    <span className={`font-bold ${className}`} style={parseStyle(perk.nameColorStyle)}>
      {name}
    </span>
  );
}

/** Renders an avatar wrapper with level-based frame */
export function LevelAvatarFrame({ level, children, className = "" }: { level: number; children: React.ReactNode; className?: string }) {
  const perk = getLevelPerk(level);
  return (
    <div className={`rounded-full ${perk.frameBorder} ${perk.frameGlow} ${className}`}>
      {children}
    </div>
  );
}

function parseStyle(styleStr: string): React.CSSProperties {
  const style: any = {};
  styleStr.split(";").forEach((rule) => {
    const [key, value] = rule.split(":").map((s) => s.trim());
    if (key && value) {
      const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      style[camelKey] = value;
    }
  });
  return style;
}
