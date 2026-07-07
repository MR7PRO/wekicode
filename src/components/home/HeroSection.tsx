import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, HelpCircle, Briefcase, FileText, Code2, Terminal, Wifi, Coins, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { animate, createTimeline, stagger } from "animejs";

interface Counts {
  users: number;
  questions: number;
  articles: number;
  jobs: number;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
  return `${n}+`;
}

export function HeroSection() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const numRefs = useRef<Array<HTMLDivElement | null>>([]);
  const animatedOnce = useRef(false);

  useEffect(() => {
    const load = async () => {
      const [u, q, a, j] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("questions").select("*", { count: "exact", head: true }),
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      setCounts({
        users: u.count ?? 0,
        questions: q.count ?? 0,
        articles: a.count ?? 0,
        jobs: j.count ?? 0,
      });
    };
    load();
  }, []);

  // Subtle entrance animation for the stat cards
  useEffect(() => {
    if (!statsRef.current) return;
    const cards = statsRef.current.querySelectorAll<HTMLElement>("[data-stat-card]");
    if (cards.length === 0) return;
    createTimeline({ defaults: { ease: "outExpo", duration: 700 } }).add(cards, {
      opacity: [0, 1],
      translateY: [24, 0],
      delay: stagger(90),
    });
  }, []);

  // Count-up numbers when live stats arrive
  useEffect(() => {
    if (!counts || animatedOnce.current) return;
    animatedOnce.current = true;
    const targets = [counts.users, counts.questions, counts.articles, counts.jobs];
    numRefs.current.forEach((el, i) => {
      if (!el) return;
      const target = targets[i];
      const obj = { v: 0 };
      animate(obj, {
        v: target,
        duration: 1400,
        ease: "outCubic",
        onUpdate: () => {
          el.textContent = formatNumber(Math.round(obj.v));
        },
      });
    });
  }, [counts]);

  const stats = [
    { icon: Users, label: "مبرمج نشط", value: counts ? formatNumber(counts.users) : "—", color: "text-primary" },
    { icon: HelpCircle, label: "سؤال", value: counts ? formatNumber(counts.questions) : "—", color: "text-accent" },
    { icon: FileText, label: "مقال", value: counts ? formatNumber(counts.articles) : "—", color: "text-success" },
    { icon: Briefcase, label: "وظيفة مفتوحة", value: counts ? formatNumber(counts.jobs) : "—", color: "text-warning" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero pt-28 lg:pt-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 home-tech-grid" />
        <div className="absolute inset-x-0 top-0 h-1/2 home-signal-field" />
        <div className="absolute right-[8%] top-[18%] h-48 w-48 rounded-full border border-primary/20 home-pulse-node" />
        <div className="absolute left-[10%] bottom-[18%] h-36 w-36 rounded-full border border-accent/20 home-pulse-node" />
        <div className="absolute left-[46%] top-[54%] h-28 w-28 rounded-full border border-success/20 home-pulse-node" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] gap-10 lg:gap-12 items-center max-w-7xl mx-auto">
          <div className="text-center lg:text-right">
          <div data-home-hero="badge" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success/30 mb-8 opacity-0">
            <span className="text-lg">🇵🇸</span>
            <span className="text-sm font-medium text-success">صنع في فلسطين - من غزة للعالم</span>
          </div>

          <h1 data-home-hero="title" className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 opacity-0">
            <span className="text-foreground">منصة </span>
            <span className="inline-block font-black transition-all duration-300 cursor-default group home-logo-code">
              <span className="text-gradient-primary">
                Weki
              </span>
              <span className="text-gradient-accent">
                Code
              </span>
            </span>
            <br />
            <span className="text-foreground">لمستقبل المبرمجين</span>
          </h1>

          <p data-home-hero="copy" className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8 opacity-0">
            منصة وحاضنة أعمال فلسطينية في قطاع غزة توفر للطلبة والفريلانسرز مساحة عمل متكاملة 
            مع كهرباء وإنترنت سريع، فرص عمل، مشاركة المعرفة ونظام نقاط تفاعلي.
          </p>

          <div data-home-hero="actions" className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
            <Link to="/jobs">
              <Button variant="hero" size="xl" className="opacity-0">
                ابدأ الآن
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/courses">
              <Button variant="glass" size="xl" className="opacity-0">
                استكشف الدورات
              </Button>
            </Link>
          </div>

          {/* Live Stats */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} data-stat-card className="glass rounded-xl p-4 md:p-6 hover-lift opacity-0">
                  <Icon className={`w-8 h-8 ${s.color} mx-auto mb-2`} />
                  <div
                    ref={(el) => { numRefs.current[i] = el; }}
                    className="text-2xl md:text-3xl font-bold text-foreground tabular-nums"
                  >
                    {s.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              );
            })}
          </div>
          </div>

          <div className="home-command-center relative hidden lg:block opacity-0" aria-hidden="true">
            <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-border/60 bg-card/60 backdrop-blur-2xl shadow-card">
              <div className="home-scan-line absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0" />
              <div className="absolute inset-0 home-panel-grid" />
              <div className="relative z-10 p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                      <Terminal className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">مركز تشغيل المنصة</div>
                      <div className="text-xs text-muted-foreground">تعلم • عمل • مجتمع • مكافئات</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-success home-pulse-node" />
                    <span className="text-xs text-success font-semibold">مباشر</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Code2, label: "أسئلة", value: counts ? formatNumber(counts.questions) : "—", tone: "primary" },
                    { icon: BookOpen, label: "تعلم", value: "9 مسارات", tone: "accent" },
                    { icon: Briefcase, label: "فرص", value: counts ? formatNumber(counts.jobs) : "—", tone: "success" },
                    { icon: Coins, label: "نقاط", value: "مكافئات", tone: "warning" },
                  ].map((item) => {
                    const Icon = item.icon;
                    const toneClass = item.tone === "primary" ? "text-primary bg-primary/10 border-primary/20" : item.tone === "accent" ? "text-accent bg-accent/10 border-accent/20" : item.tone === "success" ? "text-success bg-success/10 border-success/20" : "text-warning bg-warning/10 border-warning/20";
                    return (
                      <div key={item.label} className="home-flow-chip rounded-2xl border border-border/60 bg-background/70 p-4 shadow-card">
                        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${toneClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                        <div className="text-lg font-black text-foreground">{item.value}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">مسار مطوّر اليوم</span>
                    <Wifi className="w-4 h-4 text-primary home-pulse-node" />
                  </div>
                  <div className="space-y-3">
                    {["اختبار React", "إجابة سؤال", "حجز مساحة عمل", "استبدال نقاط"].map((step, index) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</div>
                        <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${92 - index * 16}%` }} />
                        </div>
                        <span className="w-24 text-xs text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  {["Gaza", "Remote", "Workspace"].map((label) => (
                    <div key={label} className="rounded-xl border border-border/60 bg-background/60 p-3">
                      <div className="mx-auto mb-2 h-2 w-2 rounded-full bg-success home-pulse-node" />
                      <div className="text-xs font-semibold text-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
