import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookmarkCheck, HelpCircle, FileText, Loader2 } from "lucide-react";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";

interface Item {
  id: string;
  title: string;
  type: "question" | "article";
  created_at: string;
}

export default function Bookmarks() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "question" | "article">("all");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("bookmarks")
        .select("item_id,item_type,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as { item_id: string; item_type: "question" | "article"; created_at: string }[];
      const qIds = list.filter(b => b.item_type === "question").map(b => b.item_id);
      const aIds = list.filter(b => b.item_type === "article").map(b => b.item_id);
      const [qs, ars] = await Promise.all([
        qIds.length ? supabase.from("questions").select("id,title").in("id", qIds) : Promise.resolve({ data: [] as any[] }),
        aIds.length ? supabase.from("articles").select("id,title").in("id", aIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const qMap = new Map((qs.data ?? []).map((q: any) => [q.id, q.title]));
      const aMap = new Map((ars.data ?? []).map((a: any) => [a.id, a.title]));
      setItems(list.map(b => ({
        id: b.item_id,
        type: b.item_type,
        created_at: b.created_at,
        title: (b.item_type === "question" ? qMap.get(b.item_id) : aMap.get(b.item_id)) ?? "(محذوف)",
      })));
      setLoading(false);
    })();
  }, [user]);

  const filtered = tab === "all" ? items : items.filter(i => i.type === tab);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 mb-2">
            <BookmarkCheck className="w-8 h-8 text-primary" />
            محفوظاتي
          </h1>
          <p className="text-muted-foreground mb-6">الأسئلة والمقالات التي حفظتها للرجوع إليها لاحقاً</p>

          <div className="flex gap-2 mb-6">
            {([
              { v: "all", l: "الكل" },
              { v: "question", l: "أسئلة" },
              { v: "article", l: "مقالات" },
            ] as const).map(t => (
              <button key={t.v} onClick={() => setTab(t.v)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  tab === t.v ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}>{t.l}</button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border-border/50">
              <BookmarkCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-bold text-foreground mb-2">لا توجد محفوظات</h3>
              <p className="text-muted-foreground">احفظ أي سؤال أو مقال بالضغط على أيقونة الحفظ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => {
                const Icon = item.type === "question" ? HelpCircle : FileText;
                const path = item.type === "question" ? `/questions/${item.id}` : `/articles/${item.id}`;
                return (
                  <div key={`${item.type}-${item.id}`} className="glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition">
                    <Icon className="w-5 h-5 text-primary shrink-0" />
                    <Link to={path} className="flex-1 font-medium text-foreground hover:text-primary truncate">
                      {item.title}
                    </Link>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {item.type === "question" ? "سؤال" : "مقال"}
                    </span>
                    <BookmarkButton itemId={item.id} itemType={item.type} variant="icon" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
