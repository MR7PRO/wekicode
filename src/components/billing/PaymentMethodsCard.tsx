import { Smartphone, Wallet, MessageCircle, Copy, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import jawwalPayAsset from "@/assets/payments/jawwal-pay.png.asset.json";
import bankOfPalestineAsset from "@/assets/payments/bank-of-palestine.png.asset.json";
import palPayAsset from "@/assets/payments/pal-pay.png.asset.json";

const jawwalPayLogo = jawwalPayAsset.url;
const bankOfPalestineLogo = bankOfPalestineAsset.url;
const palPayLogo = palPayAsset.url;

export const WHATSAPP_NUMBER = "972598754887";
export const ACCOUNT_NUMBER = "0598754887";
export const ACCOUNT_HOLDER = "أيهم الهور";

const paymentMethods = [
  { id: "jawwal-pay", name: "محفظة جوّال باي", logo: jawwalPayLogo, ring: "from-emerald-500/20 to-emerald-500/5" },
  { id: "bank-of-palestine", name: "بنك فلسطين", logo: bankOfPalestineLogo, ring: "from-blue-700/20 to-amber-400/5" },
  { id: "pal-pay", name: "محفظة PalPay", logo: palPayLogo, ring: "from-blue-600/20 to-orange-500/5" },
];

export function PaymentMethodsCard({ userId }: { userId?: string }) {
  const waMessage = encodeURIComponent(
    `السلام عليكم، أرغب بتفعيل اشتراكي على wekicode.${userId ? `\nمعرّف الحساب: ${userId}` : ""}\nمرفق صورة إشعار التحويل.`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `تم نسخ ${label}` });
    } catch {
      toast({ title: "تعذّر النسخ", variant: "destructive" });
    }
  };

  return (
    <div className="glass rounded-2xl p-6 border-border/50 space-y-5">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-primary" />
          طرق الدفع وتفعيل الاشتراك
        </h3>
        <p className="text-sm text-muted-foreground">
          نستقبل الدفع عبر إحدى المحافظ التالية، ثم يتم تفعيل اشتراكك خلال يوم عمل واحد كحدّ أقصى بعد إرسال صورة الإشعار.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {paymentMethods.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl border border-border/60 bg-gradient-to-br ${m.ring} p-4 flex flex-col items-center text-center`}
          >
            <div className="h-16 w-full flex items-center justify-center bg-white rounded-lg mb-3 p-2">
              <img
                src={m.logo}
                alt={m.name}
                width={120}
                height={60}
                loading="lazy"
                className="max-h-12 w-auto object-contain"
              />
            </div>
            <div className="font-bold text-sm text-foreground">{m.name}</div>
            <div className="text-[11px] text-muted-foreground mt-1">رقم الحساب موحّد للمحافظ الثلاث</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/30 divide-y divide-border/60">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">اسم صاحب الحساب</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">{ACCOUNT_HOLDER}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(ACCOUNT_HOLDER, "الاسم")}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">رقم الحساب (للمحافظ الثلاث)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground text-sm" dir="ltr">{ACCOUNT_NUMBER}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(ACCOUNT_NUMBER, "الرقم")}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">واتساب لإرسال صورة الإشعار</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground text-sm" dir="ltr">+{WHATSAPP_NUMBER}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(`+${WHATSAPP_NUMBER}`, "رقم الواتساب")}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <ol className="space-y-2 text-sm text-foreground/90 list-decimal pr-5">
        <li>حوّل قيمة الاشتراك إلى الرقم أعلاه عبر إحدى المحافظ الثلاث.</li>
        <li>التقط صورة لإشعار التحويل من تطبيق المحفظة/البنك.</li>
        <li>أرسل الصورة إلى رقم الواتساب أعلاه مع ذكر اسم المستخدم.</li>
        <li className="flex items-start gap-2"><Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />يتم تفعيل اشتراكك خلال يوم عمل واحد كحدّ أقصى من استلام صورة الإشعار.</li>
      </ol>

      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
        <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white">
          <MessageCircle className="w-4 h-4" />
          إرسال صورة الإشعار عبر واتساب
        </Button>
      </a>
    </div>
  );
}
