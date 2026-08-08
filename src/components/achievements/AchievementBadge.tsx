import {
  HelpCircle, MessageSquare, ThumbsUp, Bell, UserCheck, Sparkles, CheckCircle2,
  ShieldCheck, Crown, FileText, BookOpen, Library, Briefcase, Globe, DollarSign,
  Flame, CalendarCheck, Handshake, MessagesSquare, Star, ClipboardCheck, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AchievementDefinition } from "@/hooks/useAchievements";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  HelpCircle, MessageSquare, ThumbsUp, Bell, UserCheck, Sparkles, CheckCircle2,
  ShieldCheck, Crown, FileText, BookOpen, Library, Briefcase, Globe, DollarSign,
  Flame, CalendarCheck, Handshake, MessagesSquare, Star, ClipboardCheck,
};

/** Subtle rarity accents — deliberately restrained, no gaming-style neon. */
const RARITY: Record<string, { ring: string; text: string; label: string }> = {
  common: { ring: "border-border/60 bg-muted/30", text: "text-muted-foreground", label: "عادية" },
  uncommon: { ring: "border-emerald-500/30 bg-emerald-500/5", text: "text-emerald-500", label: "غير شائعة" },
  rare: { ring: "border-primary/40 bg-primary/5", text: "text-primary", label: "نادرة" },
  legendary: { ring: "border-amber-500/40 bg-amber-500/5", text: "text-amber-500", label: "أسطورية" },
};

interface Props {
  achievement: AchievementDefinition;
  earned?: boolean;
  earnedAt?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function AchievementBadge({ achievement, earned = false, earnedAt, size = "md", className }: Props) {
  const Icon = ICONS[achievement.icon ?? ""] ?? Award;
  const r = RARITY[achievement.rarity] ?? RARITY.common;
  const compact = size === "sm";

  return (
    <div
      title={`${achievement.title} — ${achievement.description}`}
      className={cn(
        "rounded-xl border transition-all",
        compact ? "p-2" : "p-3",
        r.ring,
        earned ? "opacity-100" : "opacity-45 grayscale",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "shrink-0 rounded-lg border flex items-center justify-center",
          compact ? "w-8 h-8" : "w-10 h-10",
          r.ring,
        )}>
          <Icon className={cn(compact ? "w-4 h-4" : "w-5 h-5", r.text)} />
        </div>
        <div className="min-w-0">
          <div className={cn("font-bold text-foreground truncate", compact ? "text-xs" : "text-sm")}>
            {achievement.title}
          </div>
          {!compact && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{achievement.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1 text-[10px]">
            <span className={r.text}>{r.label}</span>
            {achievement.points_reward > 0 && (
              <span className="text-muted-foreground">+{achievement.points_reward} نقطة</span>
            )}
            {earned && earnedAt && (
              <span className="text-muted-foreground/70">
                {new Date(earnedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}