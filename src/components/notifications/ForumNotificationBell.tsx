import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForumNotifications } from "@/hooks/useForumNotifications";
import { relativeArabic } from "@/lib/forum/api";

export function ForumNotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useForumNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="إشعارات المنتدى">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" dir="rtl">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-bold text-sm">الإشعارات</h4>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              <Check className="w-3 h-3 ml-1" /> قراءة الكل
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">لا توجد إشعارات بعد.</div>
          ) : (
            notifications.slice(0, 6).map((n) => {
              const inner = (
                <div className={`p-3 border-b border-border/60 last:border-0 hover:bg-secondary/40 cursor-pointer ${!n.is_read ? "bg-primary/5" : ""}`}>
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground line-clamp-1">{n.title}</div>
                      {n.body && <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>}
                      <div className="text-[10px] text-muted-foreground/70 mt-1">{relativeArabic(n.created_at)}</div>
                    </div>
                  </div>
                </div>
              );
              const handle = () => { markRead(n.id); setOpen(false); };
              return n.link ? (
                <Link key={n.id} to={n.link} onClick={handle}>{inner}</Link>
              ) : (
                <div key={n.id} onClick={handle}>{inner}</div>
              );
            })
          )}
        </div>
        <div className="p-2 border-t border-border text-center">
          <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
            عرض كل الإشعارات
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}