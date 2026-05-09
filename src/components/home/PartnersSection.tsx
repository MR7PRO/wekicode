import { GraduationCap, Building2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const partners = [
  {
    name: "الجامعة الإسلامية - غزة",
    icon: GraduationCap,
    url: "https://www.iugaza.edu.ps",
    desc: "إحدى أعرق الجامعات الفلسطينية في غزة، شريك أكاديمي يدعم تأهيل الطلبة في مجال البرمجة.",
  },
  {
    name: "جامعة الأزهر",
    icon: GraduationCap,
    url: "https://www.alazhar.edu.ps",
    desc: "جامعة الأزهر بغزة، تدعم برامج التدريب المهني وتمكين الطلبة من سوق العمل التقني.",
  },
  {
    name: "وزارة الاتصالات",
    icon: Building2,
    url: "https://www.mtit.pna.ps",
    desc: "وزارة الاتصالات وتكنولوجيا المعلومات الفلسطينية، شريك استراتيجي في دعم البنية التحتية الرقمية.",
  },
];

export function PartnersSection() {
  return (
    <section className="py-8 border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          <span className="text-muted-foreground text-sm font-medium">شركاء النجاح:</span>
          <TooltipProvider delayDuration={150}>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
              {partners.map((p) => {
                const Icon = p.icon;
                return (
                  <Tooltip key={p.name}>
                    <TooltipTrigger asChild>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-card/80 hover:border-primary/40 transition-colors"
                      >
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-foreground/80">{p.name}</span>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-center">
                      <p className="text-xs leading-relaxed">{p.desc}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </section>
  );
}
