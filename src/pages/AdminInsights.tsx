import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Insights {
  total_users: number; new_users_week: number; active_users_week: number;
  topics_week: number; replies_week: number; solved_topics: number;
  unanswered_topics: number; reports_pending: number; ai_usage: number;
  onboarding_rate: number; achievements_earned: number;
  top_tags: { name: string; usage_count: number }[];
  top_forums: { title: string; topics: number }[];
  most_followed_tags: { name: string; followers: number }[];
  most_followed_forums: { name: string; followers: number }[];
  error?: string;
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4 border-border/50">
      <div className="text-2xl font-black text-primary">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}

function RankList({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Card className="p-4 border-border/50">
      <h3 className="font-bold text-sm mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">لا توجد بيانات كافية بعد.</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.label}>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="text-foreground truncate">{i.label}</span>
                <span className="text-muted-foreground">{i.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div className="h-full bg-gradient-to-l from-primary to-primary/40" style={{ width: `${(i.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AdminInsights() {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["admin-insights", user?.id],
    queryFn: async (): Promise<Insights> => {
      const { data, error } = await supabase.rpc("admin_insights");
      if (error) throw error;
      return data as unknown as Insights;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const denied = !user || q.isError || q.data?.error === "forbidden";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEOHead title="لوحة رؤى المنصة" description="إحصاءات المجتمع للمشرفين" path="/admin/insights" noindex />
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-black">رؤى المنصة</h1>
        </div>

        {q.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : denied ? (
          <Card className="p-8 text-center space-y-2">
            <ShieldAlert className="w-7 h-7 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">هذه الصفحة متاحة للمشرفين فقط.</p>
          </Card>
        ) : q.data ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Metric label="إجمالي الأعضاء" value={q.data.total_users} />
              <Metric label="أعضاء جدد هذا الأسبوع" value={q.data.new_users_week} />
              <Metric label="نشطون هذا الأسبوع" value={q.data.active_users_week} />
              <Metric label="مواضيع هذا الأسبوع" value={q.data.topics_week} />
              <Metric label="ردود هذا الأسبوع" value={q.data.replies_week} />
              <Metric label="مواضيع محلولة" value={q.data.solved_topics} />
              <Metric label="بدون إجابة" value={q.data.unanswered_topics} />
              <Metric label="بلاغات معلقة" value={q.data.reports_pending} />
              <Metric label="استخدام الذكاء الاصطناعي" value={q.data.ai_usage} />
              <Metric label="نسبة إكمال الإعداد" value={`${q.data.onboarding_rate}%`} />
              <Metric label="شارات مُمنوحة" value={q.data.achievements_earned} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <RankList title="أكثر الوسوم استخدامًا" items={(q.data.top_tags ?? []).map((t) => ({ label: t.name, value: t.usage_count }))} />
              <RankList title="أنشط الأقسام" items={(q.data.top_forums ?? []).map((f) => ({ label: f.title, value: f.topics }))} />
              <RankList title="الوسوم الأكثر متابعة" items={(q.data.most_followed_tags ?? []).map((t) => ({ label: t.name, value: t.followers }))} />
              <RankList title="الأقسام الأكثر متابعة" items={(q.data.most_followed_forums ?? []).map((f) => ({ label: f.name, value: f.followers }))} />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}