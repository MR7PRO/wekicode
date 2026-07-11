import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import { BookOpen } from "lucide-react";

export default function KnowledgeArticle() {
  const { id = "" } = useParams();
  const q = useQuery({
    queryKey: ["knowledge", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("knowledge_articles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl" dir="rtl">
        {q.isLoading ? <Skeleton className="h-40 w-full" /> : !q.data ? (
          <Card className="p-6 text-center">المقال غير موجود</Card>
        ) : (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <Badge variant="outline" className="text-[10px]">{q.data.status === "published" ? "منشور" : "مسودة"}</Badge>
              <Badge className="text-[10px] bg-primary/20 text-primary">مستخرج من نقاش</Badge>
            </div>
            <h1 className="text-2xl font-black mb-2">{q.data.title}</h1>
            {q.data.excerpt && <p className="text-sm text-muted-foreground mb-4">{q.data.excerpt}</p>}
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">{q.data.content}</div>
            {q.data.tags?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-4">
                {q.data.tags.map((t: string) => <Badge key={t} variant="outline" className="text-[10px]">#{t}</Badge>)}
              </div>
            )}
            {q.data.source_topic_id && (
              <p className="text-xs text-muted-foreground mt-6">
                المصدر: <Link to={`/forums`} className="text-primary hover:underline">النقاش الأصلي</Link>
              </p>
            )}
          </Card>
        )}
      </div>
    </>
  );
}