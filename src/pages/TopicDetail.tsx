import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTopic, fetchReplies, incrementTopicViews, castVote,
  toggleBookmark, createReply, markSolution, relativeArabic, exactArabic,
} from "@/lib/forum/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Bookmark, Flag, CheckCircle2, Eye, MessageSquare } from "lucide-react";
import { TopicSummaryCard } from "@/components/ai/TopicSummaryCard";
import { AiReplyAssistant } from "@/components/ai/AiReplyAssistant";
import { ConvertToArticleButton } from "@/components/ai/ConvertToArticleButton";
import { useIsModerator } from "@/hooks/useIsModerator";

export default function TopicDetail() {
  const { forumSlug = "", topicSlugOrId = "" } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const { isModerator } = useIsModerator();

  const topicQ = useQuery({ queryKey: ["topic", topicSlugOrId], queryFn: () => fetchTopic(topicSlugOrId) });
  const repliesQ = useQuery({ queryKey: ["replies", topicSlugOrId], queryFn: () => fetchReplies(topicSlugOrId) });

  useEffect(() => { if (topicSlugOrId) incrementTopicViews(topicSlugOrId).catch(() => {}); }, [topicSlugOrId]);

  const vote = async (value: 1 | -1, replyId?: string) => {
    if (!user) return toast.error("سجّل الدخول للتصويت");
    try {
      await castVote({ userId: user.id, value, topicId: replyId ? undefined : topicSlugOrId, replyId });
      qc.invalidateQueries({ queryKey: ["topic", topicSlugOrId] });
      qc.invalidateQueries({ queryKey: ["replies", topicSlugOrId] });
    } catch (e: any) { toast.error(e.message || "فشل التصويت"); }
  };

  const onBookmark = async () => {
    if (!user) return toast.error("سجّل الدخول لحفظ الموضوع");
    const state = await toggleBookmark(user.id, topicSlugOrId);
    setBookmarked(state);
    toast.success(state ? "تم الحفظ" : "أُلغي الحفظ");
  };

  const onReply = async () => {
    if (!user) return toast.error("سجّل الدخول للرد");
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await createReply({ topicId: topicSlugOrId, userId: user.id, content: reply.trim() });
      setReply("");
      qc.invalidateQueries({ queryKey: ["replies", topicSlugOrId] });
      qc.invalidateQueries({ queryKey: ["topic", topicSlugOrId] });
      toast.success("تم نشر الرد");
    } catch (e: any) { toast.error(e.message || "فشل النشر"); }
    finally { setSubmitting(false); }
  };

  const onSolution = async (replyId: string) => {
    try {
      const res: any = await markSolution(replyId);
      if (res?.success) {
        toast.success("تم اختيار الحل");
        qc.invalidateQueries({ queryKey: ["topic", topicSlugOrId] });
        qc.invalidateQueries({ queryKey: ["replies", topicSlugOrId] });
      } else toast.error("غير مسموح");
    } catch (e: any) { toast.error(e.message || "فشل"); }
  };

  if (topicQ.isLoading) return (<><Navbar /><div className="container pt-24"><Skeleton className="h-40 w-full" /></div></>);
  if (!topicQ.data) return (<><Navbar /><div className="container pt-24"><Card className="p-6 text-center">الموضوع غير موجود</Card></div></>);

  const t = topicQ.data;
  const isAuthor = user?.id === t.author_id;
  const canConvert = t.status === "solved" && (isAuthor || isModerator);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16" dir="rtl">
        <div className="text-xs text-muted-foreground mb-3">
          <Link to="/forums" className="hover:text-primary">المنتديات</Link> ← <Link to={`/forums/${forumSlug}`} className="hover:text-primary">{t.forum_title}</Link>
        </div>
        <Card className="p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1">
              <Button size="icon" variant="outline" onClick={() => vote(1)}><ArrowUp className="w-4 h-4" /></Button>
              <span className="font-bold">{t.score}</span>
              <Button size="icon" variant="outline" onClick={() => vote(-1)}><ArrowDown className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {t.status === "solved" && <Badge className="bg-emerald-500/20 text-emerald-500">تم الحل</Badge>}
                <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
              </div>
              <h1 className="text-2xl font-black mb-2">{t.title}</h1>
              <div className="text-xs text-muted-foreground flex items-center gap-3 mb-3">
                <span>{t.author_name}</span>
                <span>· {exactArabic(t.created_at)}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {t.views_count}</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {t.replies_count}</span>
              </div>
              <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">{t.content}</div>
              {t.tags && t.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-3">
                  {t.tags.map((tag) => <Badge key={tag.id} variant="outline" className="text-[10px]">#{tag.name}</Badge>)}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={onBookmark} className="gap-1"><Bookmark className="w-3 h-3" /> {bookmarked ? "محفوظ" : "حفظ"}</Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("تم إرسال البلاغ")}><Flag className="w-3 h-3" /> إبلاغ</Button>
                {canConvert && <ConvertToArticleButton topicId={t.id} />}
              </div>
            </div>
          </div>
        </Card>

        <TopicSummaryCard topicId={t.id} repliesCount={t.replies_count} />

        <h2 className="text-lg font-bold mb-3">الردود ({repliesQ.data?.length ?? 0})</h2>
        {repliesQ.isLoading ? <Skeleton className="h-20 w-full" /> : (
          <div className="space-y-2 mb-4">
            {(repliesQ.data ?? []).map((r) => (
              <Card key={r.id} className={`p-4 ${r.is_solution ? "border-emerald-500/40 bg-emerald-500/5" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => vote(1, r.id)}><ArrowUp className="w-3 h-3" /></Button>
                    <span className="text-xs font-bold">{r.score}</span>
                    <Button size="icon" variant="ghost" onClick={() => vote(-1, r.id)}><ArrowDown className="w-3 h-3" /></Button>
                  </div>
                  <Avatar className="w-8 h-8"><AvatarImage src={r.author_avatar || undefined} /><AvatarFallback>{(r.author_name || "?")[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">{r.author_name} · {relativeArabic(r.created_at)} {r.is_solution && <span className="text-emerald-500 ml-2">✓ الحل</span>}</div>
                    <div className="text-sm whitespace-pre-wrap">{r.content}</div>
                    {isAuthor && !r.is_solution && (
                      <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={() => onSolution(r.id)}>
                        <CheckCircle2 className="w-3 h-3" /> اختر كحل
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {user ? (
          <Card className="p-4">
            <h3 className="text-sm font-bold mb-2">أضف ردًا</h3>
            <AiReplyAssistant topicId={t.id} onInsert={(txt) => setReply((prev) => (prev ? prev + "\n\n" : "") + txt)} />
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} placeholder="اكتب ردك…" />
            <div className="mt-2 flex justify-end">
              <Button onClick={onReply} disabled={submitting || !reply.trim()}>نشر الرد</Button>
            </div>
          </Card>
        ) : (
          <Card className="p-4 text-center text-sm">
            <Button variant="hero" onClick={() => nav("/auth")}>سجّل الدخول للمشاركة</Button>
          </Card>
        )}
      </div>
    </>
  );
}