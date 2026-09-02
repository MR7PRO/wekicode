import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHelpArticles } from "@/lib/trust/api";
import { HELP_CATEGORIES, type HelpArticle } from "@/lib/trust/types";
import { LifeBuoy, Search } from "lucide-react";

export default function HelpCenter() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | undefined>();

  useEffect(() => {
    setLoading(true);
    fetchHelpArticles(category, q.trim() || undefined).then((r) => {
      setArticles(r);
      setLoading(false);
    });
  }, [category, q]);

  return (
    <PageShell title="مركز المساعدة | WekiCode" description="أدلة وإجابات حول الحساب، الخدمات، الطلبات، الدفع والسياسات في WekiCode." path="/help">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <LifeBuoy className="w-6 h-6 text-primary" /> مركز المساعدة
      </h1>

      <div className="relative mb-5">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pr-9" placeholder="ابحث في المساعدة..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button size="sm" variant={!category ? "default" : "outline"} onClick={() => setCategory(undefined)}>الكل</Button>
        {HELP_CATEGORIES.map((c) => (
          <Button key={c.key} size="sm" variant={category === c.key ? "default" : "outline"} onClick={() => setCategory(c.key)}>
            {c.title}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : articles.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">
          لا توجد مقالات مطابقة. يمكنك <Link className="text-primary underline" to="/support/new">فتح تذكرة دعم</Link>.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {articles.map((a) => (
            <Link key={a.id} to={`/help/${a.slug}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground mb-1">
                    {HELP_CATEGORIES.find((c) => c.key === a.category)?.title ?? a.category}
                  </p>
                  <h2 className="font-semibold mb-1">{a.title}</h2>
                  {a.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
