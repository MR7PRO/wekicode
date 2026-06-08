import { 
  HelpCircle, 
  Briefcase, 
  BookOpen, 
  Gift, 
  Coins, 
  Shield,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: HelpCircle,
    title: "الأسئلة والأجوبة",
    description: "اطرح أسئلتك البرمجية واحصل على إجابات من خبراء المجتمع. اكسب نقاطاً عند مساعدة الآخرين.",
    link: "/questions",
    color: "primary",
    stats: "2,500+ سؤال"
  },
  {
    icon: Briefcase,
    title: "فرص العمل الحر",
    description: "تصفح عروض العمل من العملاء وقدم على المشاريع التي تناسب مهاراتك. مثل Upwork لكن محلي.",
    link: "/jobs",
    color: "accent",
    stats: "150+ فرصة عمل"
  },
  {
    icon: BookOpen,
    title: "المواد التعليمية",
    description: "تعلم من دورات ومقالات مشتركة من المبرمجين. شارك معرفتك واكسب نقاطاً.",
    link: "/courses",
    color: "success",
    stats: "80+ دورة"
  },
  {
    icon: Gift,
    title: "المكافئات والجوائز",
    description: "حوّل نقاطك إلى اشتراكات بالوورك سبيس، قسائم مالية، أو خدمات متنوعة.",
    link: "/rewards",
    color: "warning",
    stats: "20+ مكافأة"
  },
  {
    icon: Coins,
    title: "نظام النقاط",
    description: "اكسب نقاطاً من كل نشاط: إجابة سؤال، إكمال مشروع، مشاركة محتوى تعليمي.",
    link: "/profile",
    color: "primary",
    stats: "Gamification"
  },
  {
    icon: Shield,
    title: "وورك سبيس غزة",
    description: "مساحة عمل مجهزة بالكهرباء والإنترنت السريع. بيئة مثالية للإنتاجية.",
    link: "/rewards",
    color: "accent",
    stats: "24/7 متاح"
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(187_85%_53%/0.05),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">كل ما تحتاجه في</span>
            {" "}
            <span className="text-gradient-primary">مكان واحد</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            منصة متكاملة تجمع بين التعلم والعمل والمجتمع لدعم رحلتك كمبرمج
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClass = feature.color === "primary" 
              ? "text-primary bg-primary/10 group-hover:bg-primary/20" 
              : feature.color === "accent"
              ? "text-accent bg-accent/10 group-hover:bg-accent/20"
              : feature.color === "success"
              ? "text-success bg-success/10 group-hover:bg-success/20"
              : "text-warning bg-warning/10 group-hover:bg-warning/20";

            return (
              <Link 
                key={index} 
                to={feature.link}
                className="group"
              >
                <div className="h-full glass rounded-2xl p-6 hover-lift border-border/50 hover:border-primary/30 transition-all duration-300">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${colorClass} flex items-center justify-center mb-4 transition-colors duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Stats & CTA */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                      {feature.stats}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                      اكتشف
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
