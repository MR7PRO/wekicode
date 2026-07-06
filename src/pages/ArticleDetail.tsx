import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, Clock, User, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarSrc } from "@/lib/media/userAvatars";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { SEOHead } from "@/components/seo/SEOHead";

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [article, setArticle] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<number>(0);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [similar, setSimilar] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (id) {
      fetchArticle();
      incrementViews();
    }
  }, [id]);

  useEffect(() => {
    if (!article?.tags?.length) return;
    (async () => {
      const { data } = await supabase.from("articles").select("id,title").neq("id", article.id).overlaps("tags", article.tags).limit(5);
      setSimilar((data ?? []) as any);
    })();
  }, [article?.id]);

  const fetchArticle = async () => {
    const { data: art } = await supabase.from("articles").select("*").eq("id", id!).single();
    if (!art) return setLoading(false);
    setArticle(art);

    const [authorRes, commentsRes, voteRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url").eq("user_id", art.user_id).single(),
      supabase.from("article_comments").select("*").eq("article_id", id!).order("created_at", { ascending: true }),
      user ? supabase.from("article_votes").select("vote_type").eq("article_id", id!).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    setAuthor(authorRes.data);
    if (voteRes.data) setUserVote((voteRes.data as any).vote_type || 0);

    // Enrich comments with author info
    if (commentsRes.data?.length) {
      const cUserIds = [...new Set(commentsRes.data.map(c => c.user_id))];
      const { data: cProfiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", cUserIds);
      const pMap = new Map(cProfiles?.map(p => [p.user_id, p]) || []);
      setComments(commentsRes.data.map(c => ({ ...c, author: pMap.get(c.user_id) })));
    }
    setLoading(false);
  };

  const incrementViews = async () => {
    await supabase.rpc("increment_article_views" as any, { article_uuid: id });
  };

  const handleVote = async (type: number) => {
    if (!user) return toast({ title: "يجب تسجيل الدخول", variant: "destructive" });
    if (userVote === type) {
      await supabase.from("article_votes").delete().eq("article_id", id!).eq("user_id", user.id);
      setUserVote(0);
    } else if (userVote !== 0) {
      await supabase.from("article_votes").update({ vote_type: type }).eq("article_id", id!).eq("user_id", user.id);
      setUserVote(type);
    } else {
      await supabase.from("article_votes").insert({ article_id: id!, user_id: user.id, vote_type: type });
      setUserVote(type);
    }
    // Refresh article votes
    const { data } = await supabase.from("articles").select("votes").eq("id", id!).single();
    if (data) setArticle((prev: any) => ({ ...prev, votes: data.votes }));
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("article_comments").insert({
      article_id: id!,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (!error) {
      setNewComment("");
      fetchArticle();
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">المقالة غير موجودة</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead
        title={`${article.title} — wekicode`}
        description={(article.content || "").replace(/<[^>]*>/g, "").slice(0, 160) || "مقال على منصة wekicode"}
        path={`/articles/${article.id}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": article.title,
          "author": { "@type": "Person", "name": author?.full_name || "مستخدم wekicode" },
          "datePublished": article.created_at,
          "url": `https://wekicode.lovable.app/articles/${article.id}`,
          "keywords": (article.tags || []).join(", "),
        }}
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/articles" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
            <ArrowRight className="w-4 h-4" /> العودة للمقالات
          </Link>

          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8">
            <h1 className="text-3xl font-black text-foreground mb-4">{article.title}</h1>

            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
              <Link to={`/u/${article.user_id}`} className="flex items-center gap-2 hover:text-primary">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={author?.avatar_url || getUserAvatarSrc(article.user_id)} />
                  <AvatarFallback>{author?.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{author?.full_name || "مستخدم"}</span>
              </Link>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale: ar })}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{article.views || 0}</span>
            </div>

            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map((t: string) => (
                  <Link key={t} to={`/articles?tag=${encodeURIComponent(t)}`} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition">{t}</Link>
                ))}
              </div>
            )}

            {(article as any).image_url && (
              <img
                src={(article as any).image_url}
                alt={article.title}
                loading="lazy"
                className="w-full max-h-[500px] object-cover rounded-xl border border-border mb-6"
              />
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {article.content}
            </div>

            {/* Voting */}
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-border/50">
              <Button variant={userVote === 1 ? "default" : "outline"} size="sm" onClick={() => handleVote(1)}>
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <span className="font-bold text-lg">{article.votes || 0}</span>
              <Button variant={userVote === -1 ? "destructive" : "outline"} size="sm" onClick={() => handleVote(-1)}>
                <ThumbsDown className="w-4 h-4" />
              </Button>
              <div className="ms-auto"><BookmarkButton itemId={article.id} itemType="article" /></div>
            </div>
          </motion.article>

          {similar.length > 0 && (
            <div className="glass rounded-2xl p-6 mt-8">
              <h3 className="text-lg font-bold text-foreground mb-4">مقالات مشابهة</h3>
              <div className="space-y-2">
                {similar.map(s => (
                  <Link key={s.id} to={`/articles/${s.id}`} className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition text-sm font-medium text-foreground hover:text-primary">{s.title}</Link>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              التعليقات ({comments.length})
            </h3>

            {user && (
              <div className="glass rounded-2xl p-4 mb-6">
                <Textarea placeholder="أضف تعليقاً..." value={newComment} onChange={e => setNewComment(e.target.value)} className="mb-3" />
                <Button onClick={handleComment} disabled={submitting || !newComment.trim()} size="sm">
                  {submitting ? "جاري الإرسال..." : "إرسال التعليق"}
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {comments.map(c => (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Link to={`/u/${c.user_id}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.author?.avatar_url || getUserAvatarSrc(c.user_id)} />
                        <AvatarFallback>{c.author?.full_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <span className="font-medium text-sm">{c.author?.full_name || "مستخدم"}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ar })}
                    </span>
                  </div>
                  <p className="text-foreground/80 text-sm">{c.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
