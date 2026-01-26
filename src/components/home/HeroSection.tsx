import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Users, Zap, Award } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero pt-16">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success/30 mb-8 animate-fade-in">
            <span className="text-lg">🇵🇸</span>
            <span className="text-sm font-medium text-success">صنع في فلسطين - من غزة للعالم</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-slide-up">
            <span className="inline-block italic font-bold transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(45,212,191,0.7)] cursor-default">
              <span className="text-foreground">Weki</span>
              <span className="text-amber-500">Code</span>
            </span>
            <span className="text-foreground"> منصة</span>
            <br />
            <span className="text-foreground">لمستقبل المبرمجين</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            منصة وحاضنة أعمال فلسطينية في قطاع غزة توفر للطلبة والفريلانسرز مساحة عمل متكاملة 
            مع كهرباء وإنترنت سريع، فرص عمل، مشاركة المعرفة ونظام نقاط تفاعلي.
          </p>

          {/* CTA Buttons */}
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="glass rounded-xl p-4 md:p-6 hover-lift">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-foreground">15K+</div>
              <div className="text-sm text-muted-foreground">مبرمج نشط</div>
            </div>
            <div className="glass rounded-xl p-4 md:p-6 hover-lift">
              <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-foreground">2.5K+</div>
              <div className="text-sm text-muted-foreground">فرصة عمل</div>
            </div>
            <div className="glass rounded-xl p-4 md:p-6 hover-lift">
              <Award className="w-8 h-8 text-success mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">مادة تعليمية</div>
            </div>
            <div className="glass rounded-xl p-4 md:p-6 hover-lift">
              <Sparkles className="w-8 h-8 text-warning mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-foreground">50M+</div>
              <div className="text-sm text-muted-foreground">نقطة موزعة</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
