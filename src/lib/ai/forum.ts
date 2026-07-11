import { supabase } from "@/integrations/supabase/client";

export type AiAction =
  | "suggest_topic"
  | "detect_duplicates"
  | "summarize_topic"
  | "answer_draft"
  | "convert_to_article"
  | "moderation_analyze";

export interface SuggestTopicResult {
  improvedTitle?: string;
  suggestedTags?: string[];
  clarityScore?: number;
  missingDetails?: string[];
  duplicateSearchQuery?: string;
}
export interface DuplicateHit {
  topic_id: string;
  title: string;
  reason?: string;
  similarityScore?: number;
  url: string;
}
export interface DuplicatesResult {
  possibleDuplicates: DuplicateHit[];
  message?: string;
}
export interface SummaryResult {
  id?: string;
  topic_id?: string;
  summary: string;
  key_points: string[];
  solution_summary?: string | null;
  usefulReplies?: string[];
  cached?: boolean;
  created_at?: string;
}
export interface AnswerDraftResult {
  draftReply: string;
  cautionNotes?: string[];
  referencesToTopicContent?: string[];
}
export interface ConvertArticleResult {
  article_id: string;
  already?: boolean;
  article?: { id: string; title: string; slug: string; status: string };
}

export async function callAiForum<T = unknown>(action: AiAction, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-forum", {
    body: { action, ...payload },
  });
  if (error) {
    const msg = (data as any)?.message || (data as any)?.error || error.message || "فشل المساعد الذكي";
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).message || (data as any).error);
  return (data as any).result as T;
}

export async function fetchCachedSummary(topicId: string) {
  const { data } = await (supabase as any)
    .from("forum_ai_summaries")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as SummaryResult | null;
}

export async function fetchArticleByTopic(topicId: string) {
  const { data } = await (supabase as any)
    .from("knowledge_articles")
    .select("id, title, slug, status")
    .eq("source_topic_id", topicId)
    .maybeSingle();
  return data as { id: string; title: string; slug: string; status: string } | null;
}