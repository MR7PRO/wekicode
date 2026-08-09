import { useNavigate } from "react-router-dom";
import { HelpCircle, MessagesSquare, FileText, Rocket, Briefcase } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const actions = [
  { label: "سؤال", icon: HelpCircle, to: "/forums/new?type=question" },
  { label: "نقاش", icon: MessagesSquare, to: "/forums/new?type=discussion" },
  { label: "مقال", icon: FileText, to: "/articles" },
  { label: "اعرض مشروعك", icon: Rocket, to: "/forums/new?type=showcase" },
  { label: "فرصة / فريلانس", icon: Briefcase, to: "/jobs" },
];

export function MobileActionSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <SheetHeader className="text-right">
          <SheetTitle className="text-base">ماذا تريد أن تنشر؟</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                onOpenChange(false);
                navigate(a.to);
              }}
              className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 p-4 text-sm font-medium hover:border-primary/50 transition-colors"
            >
              <a.icon className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{a.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}