import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHelpArticle, sendHelpFeedback } from "@/lib/trust/api";
import { HELP_CATEGORIES, type HelpArticle } from "@/lib/trust/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";

export default function HelpArticlePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchHelpArticle(slug).then((a) => {
      setArticle(a);
      setLoading(false);
    });
  }, [slug]);

  const feedback = async (helpful: boolean) => {
    if (!user) return toast.error("سجّل الدخول لإرسال تقييمك");
    if (!article) return;
    try {
      await sendHelpFeedback(article.id, user.id, helpful);
      setVoted(true);
      toast.success("شكرًا لملاحظتك");
    } catch {
      toast.error("تعذر إرسال التقييم");
    }
  };

  const categoryTitle = article
    ? HELP_CATEGORIES.find((c) => c.key === article.category)?.title ?? article.category
    : "";

  return (
    <PageShell
      title={article ? `${article.title} | مركز المساعدة` : "مركز المساعدة"}
      description={article?.excerpt ?? "مقال مساعدة في WekiCode"}
      path={`/help/${slug ?? ""}`}
      width="narrow"
    >
      <Link to="/help" className="text-sm text-primary inline-flex items-center gap-1 mb-4">
        <ArrowRight className="w-4 h-4" /> مركز المساعدة
      </Link>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40 w-full" /></div>
      ) : !article ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">
          المقال غير متوفر. <Link className="text-primary underline" to="/help">عد إلى مركز المساعدة</Link>
        </CardContent></Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
          <Card>
            <CardContent className="pt-6">
              <div className="whitespace-pre-wrap leading-8 text-sm">{article.content}</div>
            </CardContent>
          </Card>

          <Card className="mt-5">
            <CardContent className="pt-6 flex flex-wrap items-center gap-3">
              <span className="text-sm">هل كان هذا المقال مفيدًا؟</span>
              <Button size="sm" variant="outline" disabled={voted} onClick={() => feedback(true)}>
                <ThumbsUp className="w-4 h-4 ml-1" /> نعم
              </Button>
              <Button size="sm" variant="outline" disabled={voted} onClick={() => feedback(false)}>
                <ThumbsDown className="w-4 h-4 ml-1" /> لا
              </Button>
              <Link to="/support/new" className="text-sm text-primary underline">ما زلت بحاجة لمساعدة؟</Link>
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  );
}
