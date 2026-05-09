import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GraduationCap, Laptop, Building2, Star, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type RoleKey = "student" | "freelancer" | "company";

const roles: {
  key: RoleKey;
  title: string;
  icon: typeof GraduationCap;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}[] = [
  {
    key: "student",
    title: "للطلاب",
    icon: GraduationCap,
    description: "ابدأ مسيرتك المهنية واكسب خبرة عملية من خلال مشاريع حقيقية",
    features: ["مشاريع تدريبية مجانية", "مسارات تعلم مخصصة", "نقاط إضافية للطلاب", "شهادات معتمدة"],
    cta: "انضم كطالب",
    popular: false,
  },
  {
    key: "freelancer",
    title: "للمستقلين",
    icon: Laptop,
    description: "اعثر على عملاء جدد وزد دخلك من خلال مشاريع متنوعة ومربحة",
    features: ["عمولة منخفضة 5% فقط", "مدفوعات آمنة ومضمونة", "تقييمات شفافة", "دعم على مدار الساعة"],
    cta: "ابدأ العمل الحر",
    popular: true,
  },
  {
    key: "company",
    title: "للشركات",
    icon: Building2,
    description: "اعثر على أفضل المواهب البرمجية واستقطب الخبرات المناسبة لمشاريعك",
    features: ["قاعدة مواهب متخصصة", "أدوات إدارة متقدمة", "ضمان جودة العمل", "خصومات للمشاريع الكبيرة"],
    cta: "ابدأ التوظيف",
    popular: false,
  },
];

const ROLE_LABELS: Record<RoleKey, string> = {
  student: "طالب",
  freelancer: "مستقل",
  company: "شركة",
};

export function RolesSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleKey | null>(null);
  const [selected, setSelected] = useState<RoleKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const role = (user?.user_metadata?.role as RoleKey | undefined) ?? null;
    if (role) {
      setCurrentRole(role);
      setSelected(role);
    }
  }, [user]);

  const openDialog = (preselect?: RoleKey) => {
    if (preselect) setSelected(preselect);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { role: selected } });
    setSaving(false);
    if (error) {
      toast({ title: "تعذّر الحفظ", description: error.message, variant: "destructive" });
      return;
    }
    setCurrentRole(selected);
    toast({
      title: "تم تحديث دورك",
      description: `أنت الآن مسجّل بصفة: ${ROLE_LABELS[selected]}`,
    });
    setOpen(false);
  };

  return (
    <section className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            منصة لـ<span className="text-gradient-primary">الجميع</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            سواء كنت طالباً أو مستقلاً أو شركة، لدينا ما يناسبك
          </p>
          <Button variant="hero" size="lg" onClick={() => openDialog()}>
            {currentRole ? `دورك الحالي: ${ROLE_LABELS[currentRole]} — تغيير` : "اختر دورك"}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isCurrent = currentRole === role.key;
            return (
              <Card
                key={role.key}
                className={`relative glass border-border/50 hover-lift ${
                  role.popular ? "ring-2 ring-primary shadow-glow" : ""
                } ${isCurrent ? "ring-2 ring-accent" : ""}`}
              >
                {role.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold">
                      <Star className="w-3 h-3" />
                      الأكثر شعبية
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                      <Check className="w-3 h-3" />
                      دورك الحالي
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary/20 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">{role.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={role.popular ? "default" : "outline"}
                    className="w-full"
                    onClick={() => openDialog(role.key)}
                  >
                    {role.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>اختر دورك في المنصة</DialogTitle>
            <DialogDescription>
              يساعدنا هذا في تخصيص تجربتك وعرض المحتوى الأنسب لك. يمكنك تغييره في أي وقت.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSel = selected === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelected(r.key)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-start transition-all ${
                    isSel
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border/50 hover:bg-secondary/50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{r.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>
                  </div>
                  {isSel && <Check className="w-5 h-5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={!selected || saving}>
              {saving && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
              {user ? "حفظ" : "سجّل دخولك للحفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
