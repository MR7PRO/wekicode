
-- Forum categories
CREATE TABLE public.forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_categories TO anon, authenticated;
GRANT ALL ON public.forum_categories TO service_role;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active categories" ON public.forum_categories FOR SELECT USING (is_active = true);

-- Forums
CREATE TABLE public.forums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  color text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_new boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forums TO anon, authenticated;
GRANT ALL ON public.forums TO service_role;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active forums" ON public.forums FOR SELECT USING (is_active = true);
CREATE INDEX ON public.forums(category_id);

-- Forum topics
CREATE TABLE public.forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id uuid NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  type text NOT NULL DEFAULT 'discussion',
  status text NOT NULL DEFAULT 'open',
  score integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  replies_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  solved_reply_id uuid,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_topics TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_topics TO authenticated;
GRANT ALL ON public.forum_topics TO service_role;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads topics" ON public.forum_topics FOR SELECT USING (true);
CREATE POLICY "Auth users create topics" ON public.forum_topics FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
-- Authors can update their own topics if not locked. Note: pinned/locked/featured/status transitions
-- should be restricted to moderators. TODO(phase3): add role-based policy once user_roles exists.
CREATE POLICY "Authors update own topics" ON public.forum_topics FOR UPDATE TO authenticated
  USING (auth.uid() = author_id AND is_locked = false)
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors delete own topics" ON public.forum_topics FOR DELETE TO authenticated
  USING (auth.uid() = author_id AND is_locked = false AND is_pinned = false);
CREATE INDEX ON public.forum_topics(forum_id);
CREATE INDEX ON public.forum_topics(author_id);
CREATE INDEX ON public.forum_topics(last_activity_at DESC);

-- Forum replies
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  content text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  is_solution boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_replies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_replies TO authenticated;
GRANT ALL ON public.forum_replies TO service_role;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads replies" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Auth users create replies" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own replies" ON public.forum_replies FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors delete own replies" ON public.forum_replies FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE INDEX ON public.forum_replies(topic_id);

-- Forum tags
CREATE TABLE public.forum_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_tags TO anon, authenticated;
GRANT ALL ON public.forum_tags TO service_role;
ALTER TABLE public.forum_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads tags" ON public.forum_tags FOR SELECT USING (true);

-- Topic tags
CREATE TABLE public.forum_topic_tags (
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.forum_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, tag_id)
);
GRANT SELECT ON public.forum_topic_tags TO anon, authenticated;
GRANT INSERT, DELETE ON public.forum_topic_tags TO authenticated;
GRANT ALL ON public.forum_topic_tags TO service_role;
ALTER TABLE public.forum_topic_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads topic tags" ON public.forum_topic_tags FOR SELECT USING (true);
CREATE POLICY "Topic author manages tags" ON public.forum_topic_tags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.forum_topics t WHERE t.id = topic_id AND t.author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.forum_topics t WHERE t.id = topic_id AND t.author_id = auth.uid()));

-- Forum votes
CREATE TABLE public.forum_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  value integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT forum_votes_value_check CHECK (value IN (-1, 1)),
  CONSTRAINT forum_votes_target_check CHECK ((topic_id IS NOT NULL) <> (reply_id IS NOT NULL))
);
CREATE UNIQUE INDEX forum_votes_user_topic ON public.forum_votes(user_id, topic_id) WHERE topic_id IS NOT NULL;
CREATE UNIQUE INDEX forum_votes_user_reply ON public.forum_votes(user_id, reply_id) WHERE reply_id IS NOT NULL;
GRANT SELECT ON public.forum_votes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_votes TO authenticated;
GRANT ALL ON public.forum_votes TO service_role;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads votes" ON public.forum_votes FOR SELECT USING (true);
CREATE POLICY "Users manage own votes" ON public.forum_votes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bookmarks
CREATE TABLE public.forum_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);
GRANT SELECT, INSERT, DELETE ON public.forum_bookmarks TO authenticated;
GRANT ALL ON public.forum_bookmarks TO service_role;
ALTER TABLE public.forum_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.forum_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reports
CREATE TABLE public.forum_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.forum_reports TO authenticated;
GRANT ALL ON public.forum_reports TO service_role;
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters read own reports" ON public.forum_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Auth users create reports" ON public.forum_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- updated_at triggers (reuse existing function)
CREATE TRIGGER forum_categories_updated BEFORE UPDATE ON public.forum_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER forums_updated BEFORE UPDATE ON public.forums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER forum_topics_updated BEFORE UPDATE ON public.forum_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER forum_replies_updated BEFORE UPDATE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Increment views RPC (safe, avoids extra RLS trip)
CREATE OR REPLACE FUNCTION public.increment_forum_topic_views(p_topic_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.forum_topics SET views_count = views_count + 1 WHERE id = p_topic_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_forum_topic_views(uuid) TO anon, authenticated;

-- Score recompute triggers
CREATE OR REPLACE FUNCTION public.recompute_forum_vote_targets()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_topic uuid := COALESCE(NEW.topic_id, OLD.topic_id);
  v_reply uuid := COALESCE(NEW.reply_id, OLD.reply_id);
  v_sum integer;
BEGIN
  IF v_topic IS NOT NULL THEN
    SELECT COALESCE(SUM(value),0) INTO v_sum FROM public.forum_votes WHERE topic_id = v_topic;
    UPDATE public.forum_topics SET score = v_sum WHERE id = v_topic;
  END IF;
  IF v_reply IS NOT NULL THEN
    SELECT COALESCE(SUM(value),0) INTO v_sum FROM public.forum_votes WHERE reply_id = v_reply;
    UPDATE public.forum_replies SET score = v_sum WHERE id = v_reply;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER forum_votes_score AFTER INSERT OR UPDATE OR DELETE ON public.forum_votes
  FOR EACH ROW EXECUTE FUNCTION public.recompute_forum_vote_targets();

-- Reply insert updates topic counters + activity
CREATE OR REPLACE FUNCTION public.on_forum_reply_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.forum_topics
     SET replies_count = replies_count + 1,
         last_activity_at = now()
   WHERE id = NEW.topic_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER forum_replies_after_insert AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.on_forum_reply_insert();

CREATE OR REPLACE FUNCTION public.on_forum_reply_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.forum_topics
     SET replies_count = GREATEST(replies_count - 1, 0)
   WHERE id = OLD.topic_id;
  RETURN OLD;
END; $$;
CREATE TRIGGER forum_replies_after_delete AFTER DELETE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.on_forum_reply_delete();

-- Topic activity on update
CREATE OR REPLACE FUNCTION public.touch_topic_activity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_activity_at = now();
  RETURN NEW;
END; $$;

-- Mark solution RPC (only topic author)
CREATE OR REPLACE FUNCTION public.mark_forum_solution(p_reply_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_topic uuid;
  v_author uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'auth'); END IF;
  SELECT topic_id INTO v_topic FROM public.forum_replies WHERE id = p_reply_id;
  IF v_topic IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  SELECT author_id INTO v_author FROM public.forum_topics WHERE id = v_topic;
  IF v_author <> v_uid THEN RETURN jsonb_build_object('success', false, 'error', 'forbidden'); END IF;
  UPDATE public.forum_replies SET is_solution = false WHERE topic_id = v_topic;
  UPDATE public.forum_replies SET is_solution = true WHERE id = p_reply_id;
  UPDATE public.forum_topics SET status = 'solved', solved_reply_id = p_reply_id WHERE id = v_topic;
  RETURN jsonb_build_object('success', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.mark_forum_solution(uuid) TO authenticated;

-- Tag usage triggers
CREATE OR REPLACE FUNCTION public.on_topic_tag_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER forum_topic_tags_usage AFTER INSERT OR DELETE ON public.forum_topic_tags
  FOR EACH ROW EXECUTE FUNCTION public.on_topic_tag_change();
