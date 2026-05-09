import { Coins, HelpCircle, CheckCircle, BookOpen, Star, TrendingUp, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { computeLevelInfo } from "@/lib/leveling";

const earnMethods = [
  { icon: HelpCircle, label: "أجب على سؤال", points: "+10", color: "primary" },
  { icon: CheckCircle, label: "أكمل مشروع", points: "+50", color: "success" },
  { icon: BookOpen, label: "شارك مادة تعليمية", points: "+25", color: "accent" },
  { icon: Star, label: "احصل على تقييم 5 نجوم", points: "+15", color: "warning" },
];

export function PointsSection() {
  const { user, profile } = useAuth();
  const points = profile?.points ?? 0;
  const info = computeLevelInfo(points, profile?.level);
  const levelLabel = `المستوى ${info.level}`;
  const progressLabel = info.isMaxLevel
    ? "اكتمل"
    : `${info.progressInLevel} / ${info.pointsNeeded}`;
  const progressPercent = Math.round(info.progressPercentage);

  const displayPoints = user ? points : 1250;
  const ctaHref = user ? "/profile" : "/auth";
  const ctaLabel = user ? "اعرض ملفي وأكمل المهام" : "ابدأ الآن لكسب النقاط";

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6">
              <Coins className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">نظام المكافآت</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-foreground">اكسب نقاطاً مع</span>
              <br />
              <span className="text-gradient-accent">كل نشاط تقوم به</span>
            </h2>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              نظام Gamification يحفزك على المشاركة والإنتاج. كل تفاعل يُحتسب —
              من الإجابة على الأسئلة إلى إكمال المشاريع ومشاركة المعرفة.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {earnMethods.map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className="glass rounded-xl p-4 hover-lift border-border/50 hover:border-accent/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${
                        m.color === "primary" ? "text-primary" :
                        m.color === "success" ? "text-success" :
                        m.color === "accent" ? "text-accent" : "text-warning"
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-foreground">{m.label}</div>
                        <div className="text-lg font-bold text-gradient-accent">{m.points}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to={ctaHref}>
              <Button variant="hero" size="lg" className="gap-2">
                {ctaLabel}
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="glass rounded-3xl p-8 border-accent/20 shadow-accent animate-pulse-glow">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-accent mb-4">
                  <Coins className="w-12 h-12 text-accent-foreground" />
                </div>
                <div className="text-5xl font-black text-gradient-accent mb-2 tabular-nums">
                  {displayPoints.toLocaleString("en-US")}
                </div>
                <div className="text-muted-foreground">
                  {user ? "نقاطك الحالية" : "مثال على نقاط مستخدم"}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{user ? levelLabel : "المستوى 5"}</span>
                  <span className="text-accent font-medium">
                    {user ? progressLabel : "750 / 1000"}
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-accent rounded-full transition-all duration-500"
                    style={{ width: `${user ? progressPercent : 75}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground">
                    {user ? (profile?.current_streak ?? 0) : "+120"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user ? "أيام متتالية" : "هذا الأسبوع"}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <HelpCircle className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground">
                    {user ? (profile?.longest_streak ?? 0) : "45"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user ? "أطول سلسلة" : "إجابة"}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <CheckCircle className="w-5 h-5 text-accent mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground">
                    {user ? (profile?.badges?.length ?? 0) : "12"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user ? "شارة" : "مشروع"}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow animate-float">
              <span className="text-2xl font-bold text-primary-foreground">+50</span>
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-lg bg-gradient-success flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: "-2s" }}>
              <Star className="w-8 h-8 text-success-foreground" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
