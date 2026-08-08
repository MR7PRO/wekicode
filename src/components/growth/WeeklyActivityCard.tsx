import { Link } from "react-router-dom";
import { Flame, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useStreaks } from "@/hooks/useStreaks";

const WEEKLY_TARGET = 30;

const NEXT_ACTIONS = [
  { label: "اكتب ردًا مفيدًا على سؤال مفتوح", href: "/forums" },
  { label: "حوّل حلك إلى مقال معرفي", href: "/forums/new?type=article" },
  { label: "شارك مشروعك مع المجتمع", href: "/forums/new?type=showcase" },
  { label: "تابع وسمًا يهمك", href: "/forums" },
];

export function WeeklyActivityCard() {
  const { streak, loading } = useStreaks();

  if (loading) return <Skeleton className="h-32 w-full rounded-xl" />;

  const current = streak?.current_streak ?? 0;
  const weekly = streak?.weekly_points ?? 0;
  const pct = Math.min((weekly / WEEKLY_TARGET) * 100, 100);
  const next = NEXT_ACTIONS[(current + weekly) % NEXT_ACTIONS.length];

  return (
    <Card className="p-4 border-border/50 glass">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" /> نشاطك هذا الأسبوع
      </h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg border border-border/40 bg-card/30">
          <div className="text-lg font-black text-primary">{current}</div>
          <div className="text-[10px] text-muted-foreground">يوم متتالي</div>
        </div>
        <div className="text-center p-2 rounded-lg border border-border/40 bg-card/30">
          <div className="text-lg font-black text-primary">{weekly}</div>
          <div className="text-[10px] text-muted-foreground">نقاط الأسبوع</div>
        </div>
      </div>
      <Progress value={pct} className="h-1.5" />
      <p className="text-[10px] text-muted-foreground mt-1.5">
        {weekly === 0 ? "ابدأ بأول مساهمة هذا الأسبوع — استمر بالتعلم." : `${weekly} من ${WEEKLY_TARGET} نقطة أسبوعية`}
      </p>
      <Link
        to={next.href}
        className="mt-3 flex items-center gap-2 text-[11px] p-2 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-card/60 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-foreground">{next.label}</span>
      </Link>
    </Card>
  );
}