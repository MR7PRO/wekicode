import { Award } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SELLER_LEVEL_LABELS, SELLER_LEVEL_CRITERIA, type SellerLevel } from "@/lib/trust/types";

const TONES: Record<SellerLevel, string> = {
  new: "border-border bg-muted/50 text-muted-foreground",
  active: "border-primary/30 bg-primary/10 text-primary",
  professional: "border-accent/40 bg-accent/10 text-accent-foreground",
  elite: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  partner: "border-primary/50 bg-gradient-to-l from-primary/20 to-accent/20 text-primary",
};

export function SellerLevelBadge({ level, className }: { level: SellerLevel; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", TONES[level], className)}>
          <Award className="w-3 h-3" />
          {SELLER_LEVEL_LABELS[level]}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-right">
        <p className="font-semibold">{SELLER_LEVEL_LABELS[level]}</p>
        <p className="text-xs mt-1">{SELLER_LEVEL_CRITERIA[level]}</p>
      </TooltipContent>
    </Tooltip>
  );
}