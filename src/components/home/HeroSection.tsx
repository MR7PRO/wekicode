import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Users, Zap, Award, HelpCircle, Briefcase, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const stats = [
    { icon: Users, label: "مبرمج نشط", value: counts ? formatNumber(counts.users) : "—", color: "text-primary" },
    { icon: HelpCircle, label: "سؤال", value: counts ? formatNumber(counts.questions) : "—", color: "text-accent" },
    { icon: FileText, label: "مقال", value: counts ? formatNumber(counts.articles) : "—", color: "text-success" },
    { icon: Briefcase, label: "وظيفة مفتوحة", value: counts ? formatNumber(counts.jobs) : "—", color: "text-warning" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero pt-28 lg:pt-32">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success/30 mb-8 animate-fade-in">
            <span className="text-lg">🇵🇸</span>
            <span className="text-sm font-medium text-success">صنع في فلسطين - من غزة للعالم</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-slide-up">
            <span className="text-foreground">منصة </span>
            <span className="inline-block font-black transition-all duration-300 cursor-default group">
              <span className="bg-gradient-to-b from-sky-300 via-blue-500 to-blue-700 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.7)]">
                Weki
              </span>
              <span className="bg-gradient-to-b from-amber-300 via-orange-500 to-orange-700 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_25px_rgba(249,115,22,0.7)]">
                Code
              </span>
            </span>
            <br />
            <span className="text-foreground">لمستقبل المبرمجين</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            منصة وحاضنة أعمال فلسطينية في قطاع غزة توفر للطلبة والفريلانسرز مساحة عمل متكاملة 
            مع كهرباء وإنترنت سريع، فرص عمل، مشاركة المعرفة ونظام نقاط تفاعلي.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/jobs">
              <Button variant="hero" size="xl">
                ابدأ الآن
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/courses">
              <Button variant="glass" size="xl">
                استكشف الدورات
              </Button>
            </Link>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="glass rounded-xl p-4 md:p-6 hover-lift">
                  <Icon className={`w-8 h-8 ${s.color} mx-auto mb-2`} />
                  <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                    {s.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              );
            })}
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
