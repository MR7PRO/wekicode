import { memo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Code2, MessagesSquare, Bell, User, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useForumNotifications } from "@/hooks/useForumNotifications";
import { MobileActionSheet } from "@/components/mobile/MobileActionSheet";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "الرئيسية", icon: Code2 },
  { path: "/forums", label: "المنتديات", icon: MessagesSquare },
  { path: "/notifications", label: "الإشعارات", icon: Bell, auth: true, badge: true },
  { path: "/profile", label: "حسابي", icon: User, auth: true },
];

function BottomNavBase() {
  const location = useLocation();
  const { user } = useAuth();
  const { unread } = useForumNotifications();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const renderItem = (item: (typeof navItems)[number]) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.auth && !user ? "/auth" : item.path}
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] rounded-xl transition-colors",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="relative">
          <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_8px_hsl(var(--primary))]")} />
          {item.badge && user && unread > 0 && (
            <span className="absolute -top-1.5 -end-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        <span className="text-[10px] font-medium truncate max-w-[64px]">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch h-16 px-1">
          {navItems.slice(0, 2).map(renderItem)}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => (user ? setSheetOpen(true) : (window.location.href = "/auth"))}
              aria-label="اطرح"
              className="-mt-6 w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[9px] font-bold">اطرح</span>
            </button>
          </div>
          {navItems.slice(2).map(renderItem)}
        </div>
      </nav>
      <MobileActionSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}

export const BottomNav = memo(BottomNavBase);
