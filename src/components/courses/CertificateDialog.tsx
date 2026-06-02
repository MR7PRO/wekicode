import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CertificateDialogProps {
  courseTitle: string;
  courseId: string;
  instructor: string;
  studentName: string;
  completionDate?: Date;
  trigger?: React.ReactNode;
}

export function CertificateDialog({
  courseTitle,
  courseId,
  instructor,
  studentName,
  completionDate = new Date(),
  trigger,
}: CertificateDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const certNumber = `WKC-${courseId.slice(0, 8).toUpperCase()}-${completionDate.getFullYear()}`;
  const dateStr = completionDate.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const shareUrl = `${window.location.origin}/courses?cert=${certNumber}`;

  const handlePrint = () => {
    const node = ref.current;
    if (!node) return;
    const w = window.open("", "_blank", "width=1100,height=800");
    if (!w) return;
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>شهادة - ${courseTitle}</title>
      <style>
        @page { size: A4 landscape; margin: 0; }
        body { margin: 0; font-family: 'Cairo', system-ui, sans-serif; background: #f5f5f5; }
        .wrap { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
        ${document.querySelector("style")?.innerHTML || ""}
      </style></head><body><div class="wrap">${node.outerHTML}</div>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}</script>
      </body></html>`);
    w.document.close();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `شهادة إتمام: ${courseTitle}`, text: `لقد أتممت دورة ${courseTitle} على WekiCode 🎓`, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "تم نسخ رابط الشهادة ✅" });
    } catch {/* user cancelled */}
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="w-full mt-2 border-warning/50 text-warning hover:bg-warning/10">
            <Award className="w-4 h-4" />
            شهادة الإتمام
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>شهادة إتمام الدورة</DialogTitle>
        </DialogHeader>
        <div
          ref={ref}
          dir="rtl"
          className="relative mx-auto w-full aspect-[1.414/1] rounded-2xl overflow-hidden border-8 border-double border-primary/40 bg-gradient-to-br from-background via-primary/5 to-accent/10 p-6 md:p-10 text-center"
        >
          <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0%, transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--accent)) 0%, transparent 40%)" }} />
          <div className="relative z-10 flex flex-col items-center gap-3 h-full justify-between">
            <div>
              <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-bold tracking-widest text-muted-foreground uppercase">
                <Award className="w-5 h-5 text-warning" /> WekiCode Academy
              </div>
              <h2 className="mt-3 text-2xl md:text-4xl font-black">
                <span className="bg-gradient-to-b from-sky-300 via-blue-500 to-blue-700 bg-clip-text text-transparent">شهادة</span>{" "}
                <span className="bg-gradient-to-b from-amber-300 via-orange-500 to-orange-700 bg-clip-text text-transparent">إتمام</span>
              </h2>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">تشهد منصة WekiCode بأن</p>
            </div>
            <div>
              <p className="text-3xl md:text-5xl font-bold text-foreground border-b-2 border-primary/30 pb-2 px-6">{studentName || "متعلّم"}</p>
              <p className="mt-4 text-sm md:text-base text-muted-foreground">قد أتمّ بنجاح دورة</p>
              <p className="mt-2 text-xl md:text-2xl font-bold text-primary">{courseTitle}</p>
            </div>
            <div className="w-full grid grid-cols-3 gap-4 text-xs md:text-sm mt-4">
              <div>
                <div className="font-bold text-foreground">{dateStr}</div>
                <div className="text-muted-foreground">تاريخ الإتمام</div>
              </div>
              <div>
                <div className="font-mono font-bold text-foreground">{certNumber}</div>
                <div className="text-muted-foreground">رقم الشهادة</div>
              </div>
              <div>
                <div className="font-bold text-foreground">{instructor}</div>
                <div className="text-muted-foreground">المدرّب</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4" /> مشاركة
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> طباعة
          </Button>
          <Button variant="hero" onClick={handlePrint}>
            <Download className="w-4 h-4" /> تنزيل PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}