import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Plus, Search, ThumbsUp, MessageSquare, Eye, Clock, User, X, Filter, Tag
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarSrc } from "@/lib/media/userAvatars";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { SEOHead } from "@/components/seo/SEOHead";

interface Article {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  views: number;
  votes: number;
  comments_count: number;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null };
}

export default function Articles() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState(searchParams.get("tag") ?? "");
  const [sortBy, setSortBy] = useState("newest");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    const t = searchParams.get("tag") ?? "";
    if (t !== tagFilter) setTagFilter(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setTag = (t: string) => {
    setTagFilter(t);
    if (!t) { searchParams.delete("tag"); setSearchParams(searchParams, { replace: true }); }
    else { searchParams.set("tag", t); setSearchParams(searchParams, { replace: true }); }
  };

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setArticles(data.map(a => ({ ...a, author: profileMap.get(a.user_id) || { full_name: null, avatar_url: null } })) as Article[]);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("articles").insert({
      user_id: user.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
    });

    if (error) {
      toast({ title: "خطأ", description: "فشل نشر المقالة", variant: "destructive" });
    } else {
      toast({ title: "تم النشر!", description: "حصلت على 15 نقطة 🎉" });
      setShowCreate(false);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      fetchArticles();
    }
    setSubmitting(false);
  };

  const allTags = [...new Set(articles.flatMap(a => a.tags || []))];

  const filtered = articles
    .filter(a => {
      const matchSearch = !searchQuery || a.title.includes(searchQuery) || a.content.includes(searchQuery);
      const matchTag = !tagFilter || a.tags?.includes(tagFilter);
      return matchSearch && matchTag;
    })
    .sort((a, b) => {
      if (sortBy === "votes") return (b.votes || 0) - (a.votes || 0);
      if (sortBy === "views") return (b.views || 0) - (a.views || 0);
      if (sortBy === "comments") return (b.comments_count || 0) - (a.comments_count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const hasFilters = searchQuery || tagFilter || sortBy !== "newest";
  const resetFilters = () => { setSearchQuery(""); setTagFilter(""); setSortBy("newest"); };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead
        title="المقالات التقنية — wekicode"
        description="اقرأ مقالات تقنية كتبها مبرمجون عرب. شارك خبرتك وتعلم من تجارب الآخرين على منصة wekicode."
        path="/articles"
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                المقالات التقنية
              </h1>
              <p className="text-muted-foreground mt-1">شارك معرفتك واحصل على نقاط</p>
            </div>
            {user && (
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <Plus className="w-4 h-4" />
                    كتابة مقالة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>مقالة جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="عنوان المقالة" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <Textarea placeholder="اكتب محتوى المقالة..." className="min-h-[200px]" value={newContent} onChange={e => setNewContent(e.target.value)} />
                    <Input placeholder="الوسوم (مفصولة بفاصلة): react, javascript, python" value={newTags} onChange={e => setNewTags(e.target.value)} />
                    <Button onClick={handleCreate} disabled={submitting || !newTitle.trim() || !newContent.trim()} className="w-full">
                      {submitting ? "جاري النشر..." : "نشر المقالة (+15 نقطة)"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Filters */}
          <div className="glass rounded-2xl p-4 mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="ابحث في المقالات..." className="pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex gap-2">
                {["newest", "votes", "views", "comments"].map(s => (
                  <Button key={s} variant={sortBy === s ? "default" : "outline"} size="sm" onClick={() => setSortBy(s)}>
                    {s === "newest" ? "الأحدث" : s === "votes" ? "الأعلى تصويتاً" : s === "views" ? "الأكثر مشاهدة" : "الأكثر تعليقاً"}
                  </Button>
                ))}
              </div>
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Tag className="w-4 h-4 text-muted-foreground mt-1" />
                {allTags.slice(0, 15).map(tag => (
                  <Button key={tag} variant={tagFilter === tag ? "default" : "ghost"} size="sm" className="text-xs" onClick={() => setTag(tagFilter === tag ? "" : tag)}>
                    {tag}
                  </Button>
                ))}
              </div>
            )}
            {hasFilters && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">عرض {filtered.length} من {articles.length} مقالة</span>
                <Button variant="ghost" size="sm" onClick={() => { resetFilters(); searchParams.delete("tag"); setSearchParams(searchParams, { replace: true }); }}><X className="w-4 h-4 ml-1" />إعادة تعيين</Button>
              </div>
            )}
          </div>

          {/* Articles list */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">لا توجد مقالات</h3>
                <p className="text-muted-foreground">كن أول من يكتب مقالة تقنية!</p>
              </div>
            ) : (
              filtered.map((article, i) => (
                <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/articles/${article.id}`}>
                    <div className="glass rounded-2xl p-6 hover:border-primary/30 transition-all group">
                      <div className="flex items-start gap-4">
                        <Link to={`/u/${article.user_id}`} onClick={e => e.stopPropagation()} className="shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={article.author?.avatar_url || getUserAvatarSrc(article.user_id)} />
                            <AvatarFallback>{article.author?.full_name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {article.title}
                          </h2>
                          <p className="text-muted-foreground text-sm line-clamp-2 mt-1">{article.content}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <Link to={`/u/${article.user_id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-primary transition-colors">
                              <User className="w-3 h-3" />{article.author?.full_name || "مستخدم"}
                            </Link>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale: ar })}
                            </span>
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{article.votes || 0}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{article.comments_count || 0}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views || 0}</span>
                          </div>
                          {article.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {article.tags.map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTag(t); }}
                                  className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs hover:bg-primary/20 transition"
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="shrink-0">
                          <BookmarkButton itemId={article.id} itemType="article" variant="icon" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
