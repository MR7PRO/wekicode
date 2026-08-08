import { useMemo } from "react";
import { Award, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { useAchievements } from "@/hooks/useAchievements";
import { useFeature } from "@/hooks/useFeatureFlags";

export default function Achievements() {
  const { enabled } = useFeature("achievements");
  const { definitions, earned, earnedIds, loading, error } = useAchievements();

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof definitions>();
    for (const d of definitions) {
      map.set(d.category, [...(map.get(d.category) ?? []), d]);
    }
    return Array.from(map.entries());
  }, [definitions]);

  const earnedAt = new Map(earned.map((e) => [e.achievement_id, e.earned_at]));
  const pct = definitions.length ? Math.round((earnedIds.size / definitions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEOHead title="الإنجازات والشارات — WekiCode" description="شارات مجتمع WekiCode التي تُمنح على المساهمات المفيدة." path="/achievements" />
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-black text-foreground">الإنجازات والشارات</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          الشارات تُمنح تلقائيًا على المساهمات المفيدة — لا يمكن الحصول عليها بالنشر العشوائي.
        </p>

        {!enabled ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">هذه الميزة غير مفعلة حاليًا.</Card>
        ) : loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : error ? (
          <Card className="p-8 text-center text-sm text-destructive">تعذر تحميل الشارات.</Card>
        ) : definitions.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">لا توجد بيانات كافية بعد.</Card>
        ) : (
          <>
            <Card className="p-4 mb-6 border-border/50 glass">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">تقدمك</span>
                <span className="text-xs text-primary font-bold">{earnedIds.size} / {definitions.length}</span>
              </div>
              <Progress value={pct} className="h-1.5" />
              {earnedIds.size === 0 && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  لم تحصل على شارات بعد. ابدأ بأول مساهمة لتحصل على أول إنجاز.
                </p>
              )}
            </Card>

            <div className="space-y-6">
              {byCategory.map(([category, items]) => (
                <section key={category}>
                  <h2 className="text-lg font-bold mb-2">{category}</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map((a) => (
                      <AchievementBadge
                        key={a.id}
                        achievement={a}
                        earned={earnedIds.has(a.id)}
                        earnedAt={earnedAt.get(a.id) ?? null}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}