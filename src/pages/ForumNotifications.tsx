import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";
import { useForumNotifications } from "@/hooks/useForumNotifications";
import { relativeArabic } from "@/lib/forum/api";

export default function ForumNotifications() {
  const { notifications, unread, loading, markRead, markAllRead } = useForumNotifications();
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black">الإشعارات</h1>
          {unread > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead}><Check className="w-4 h-4 ml-1" /> قراءة الكل</Button>
          )}
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">لا توجد إشعارات بعد.</Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const body = (
                <Card className={`p-3 hover:border-primary/40 transition-all ${!n.is_read ? "bg-primary/5 border-primary/20" : ""}`}>
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{n.title}</div>
                      {n.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
                      <div className="text-[10px] text-muted-foreground/70 mt-1">{relativeArabic(n.created_at)}</div>
                    </div>
                  </div>
                </Card>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} onClick={() => markRead(n.id)}>{body}</Link>
              ) : (
                <div key={n.id} onClick={() => markRead(n.id)}>{body}</div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}