import { Link } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/contexts/AuthContext";

interface Props { contributionsCount?: number }

export function ProfileCompletionCard({ contributionsCount = 0 }: Props) {
  const { user } = useAuth();
  const { prefs, loading } = useOnboarding();
  if (!user || loading || !prefs) return null;

  const items = [
    { label: "صورة شخصية", done: !!prefs.avatar_url },
    { label: "اسم مستخدم", done: !!prefs.username },
    { label: "نبذة تعريفية", done: !!prefs.bio },
    { label: "مهارات", done: (prefs.skills?.length ?? 0) > 0 },
    { label: "رابط أعمال / GitHub", done: !!(prefs.portfolio_url || prefs.github_url) },
    { label: "أول مساهمة", done: contributionsCount > 0 },
  ];
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  if (pct === 100) return null;

  return (
    <Card className="p-4 border-border/50 glass">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm">اكتمال ملفك الشخصي</h3>
        <span className="text-xs font-bold text-primary">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5 mb-3" />
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-2 text-[11px]">
            {i.done
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              : <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            <span className={i.done ? "text-muted-foreground line-through" : "text-foreground"}>{i.label}</span>
          </li>
        ))}
      </ul>
      <Link to="/profile" className="block mt-3 text-[11px] text-primary hover:underline">أكمل ملفك الآن</Link>
    </Card>
  );
}