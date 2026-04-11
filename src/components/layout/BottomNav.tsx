import { Link, useLocation } from "react-router-dom";
import { Code2, HelpCircle, BookOpen, FileText, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "الرئيسية", icon: Code2 },
  { path: "/questions", label: "الأسئلة", icon: HelpCircle },
  { path: "/articles", label: "المقالات", icon: FileText },
  { path: "/courses", label: "التعليم", icon: BookOpen },
  { path: "/profile", label: "حسابي", icon: User, auth: true },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => {
          if (item.auth && !user) return null;
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.auth && !user ? "/auth" : item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
