
-- ai_usage_logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  input_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_day_idx ON public.ai_usage_logs(user_id, action, created_at);
GRANT SELECT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_logs_select" ON public.ai_usage_logs FOR SELECT TO authenticated USING (user_id = auth.uid());

-- forum_ai_summaries
CREATE TABLE IF NOT EXISTS public.forum_ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  summary text NOT NULL,
  key_points text[] NOT NULL DEFAULT '{}',
  solution_summary text,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  model_name text,
  input_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(topic_id, input_hash)
);
CREATE INDEX IF NOT EXISTS forum_ai_summaries_topic_idx ON public.forum_ai_summaries(topic_id, created_at DESC);
GRANT SELECT ON public.forum_ai_summaries TO anon, authenticated;
GRANT ALL ON public.forum_ai_summaries TO service_role;
ALTER TABLE public.forum_ai_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_summaries" ON public.forum_ai_summaries FOR SELECT TO anon, authenticated USING (true);

-- knowledge_articles
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_topic_id uuid REFERENCES public.forum_topics(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE,
  excerpt text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS knowledge_articles_status_idx ON public.knowledge_articles(status, created_at DESC);
CREATE INDEX IF NOT EXISTS knowledge_articles_source_idx ON public.knowledge_articles(source_topic_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_articles TO authenticated;
GRANT SELECT ON public.knowledge_articles TO anon;
GRANT ALL ON public.knowledge_articles TO service_role;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published" ON public.knowledge_articles FOR SELECT TO anon, authenticated
  USING (status = 'published' OR author_id = auth.uid() OR public.is_forum_mod(auth.uid()));
CREATE POLICY "author_or_mod_insert" ON public.knowledge_articles FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() OR public.is_forum_mod(auth.uid()));
CREATE POLICY "author_or_mod_update" ON public.knowledge_articles FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_forum_mod(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR public.is_forum_mod(auth.uid()));
CREATE POLICY "mod_delete" ON public.knowledge_articles FOR DELETE TO authenticated
  USING (public.is_forum_mod(auth.uid()));

CREATE TRIGGER trg_knowledge_articles_updated
BEFORE UPDATE ON public.knowledge_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_forum_ai_summaries_updated
BEFORE UPDATE ON public.forum_ai_summaries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: count today's AI actions for a user
CREATE OR REPLACE FUNCTION public.ai_usage_count_today(_user_id uuid, _action text)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.ai_usage_logs
  WHERE user_id = _user_id AND action = _action
    AND created_at >= (now() - interval '24 hours');
$$;
