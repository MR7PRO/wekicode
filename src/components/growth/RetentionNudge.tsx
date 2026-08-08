import { Link } from "react-router-dom";
import { X, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNudges } from "@/hooks/useNudges";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useFollowedTags, useFollowedForums } from "@/hooks/useForumFollows";

interface Nudge { key: string; text: string; cta: string; href: string }

/** At most 2 nudges are shown at a time, and each can be dismissed forever. */
const MAX_VISIBLE = 2;

export function RetentionNudge() {
  const { user } = useAuth();
  const { prefs } = useOnboarding();
  const { isDismissed, dismiss, loading } = useNudges();
  const tags = useFollowedTags();
  const forums = useFollowedForums();

  if (!user || loading) return null;

  const candidates: Nudge[] = [];

  if (prefs && (!prefs.bio || !prefs.avatar_url || !(prefs.skills?.length))) {
    candidates.push({
      key: "complete_profile",
      text: "أكمل ملفك الشخصي ليظهر للآخرين ويزيد فرصك.",
      cta: "أكمل الملف", href: "/profile",
    });
  }
  if (tags.tags.length === 0) {
    candidates.push({
      key: "follow_tags",
      text: "تابع وسومك المفضلة لتصلك المواضيع المناسبة لمسارك.",
      cta: "تصفح الوسوم", href: "/forums",
    });
  }
  if (forums.forums.length === 0) {
    candidates.push({
      key: "follow_forums",
      text: "تابع الأقسام التي تهمك لتظهر في صفحتك الرئيسية.",
      cta: "تصفح الأقسام", href: "/forums",
    });
  }
  candidates.push({
    key: "first_reply",
    text: "جرّب تكتب أول رد مفيد — الردود الموثقة تبني سمعتك.",
    cta: "ابحث عن سؤال", href: "/forums",
  });
  candidates.push({
    key: "solution_to_article",
    text: "عندك حل مفيد؟ حوّله إلى مقال في مكتبة المعرفة.",
    cta: "اكتب مقال", href: "/forums/new?type=article",
  });

  const visible = candidates.filter((n) => !isDismissed(n.key)).slice(0, MAX_VISIBLE);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((n) => (
        <Card key={n.key} className="p-3 border-border/50 bg-card/40">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-foreground leading-relaxed">{n.text}</p>
              <Link to={n.href}>
                <Button size="sm" variant="link" className="h-auto p-0 mt-1 text-[11px] text-primary">
                  {n.cta}
                </Button>
              </Link>
            </div>
            <button
              onClick={() => void dismiss(n.key)}
              aria-label="إخفاء التنبيه"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}