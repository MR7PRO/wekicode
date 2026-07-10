
-- =========================================================
-- Roles
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user','moderator','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated, anon;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles readable" ON public.user_roles;
CREATE POLICY "roles readable" ON public.user_roles FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_forum_mod(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('moderator','admin')
  );
$$;

-- Admin-only role management
DROP POLICY IF EXISTS "admins manage roles ins" ON public.user_roles;
CREATE POLICY "admins manage roles ins" ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "admins manage roles upd" ON public.user_roles;
CREATE POLICY "admins manage roles upd" ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "admins manage roles del" ON public.user_roles;
CREATE POLICY "admins manage roles del" ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- Notifications
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own notifications read" ON public.user_notifications;
CREATE POLICY "own notifications read" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own notifications update" ON public.user_notifications;
CREATE POLICY "own notifications update" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own notifications delete" ON public.user_notifications;
CREATE POLICY "own notifications delete" ON public.user_notifications
  FOR DELETE USING (auth.uid() = user_id);
-- No INSERT policy: only SECURITY DEFINER triggers/service_role can create rows.

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read_created
  ON public.user_notifications (user_id, is_read, created_at DESC);

-- =========================================================
-- Reports enhancement
-- =========================================================
ALTER TABLE public.forum_reports
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution text;

-- Moderators can read + update all reports
DROP POLICY IF EXISTS "mods read reports" ON public.forum_reports;
CREATE POLICY "mods read reports" ON public.forum_reports
  FOR SELECT USING (public.is_forum_mod(auth.uid()));
DROP POLICY IF EXISTS "mods update reports" ON public.forum_reports;
CREATE POLICY "mods update reports" ON public.forum_reports
  FOR UPDATE USING (public.is_forum_mod(auth.uid()))
  WITH CHECK (public.is_forum_mod(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_forum_reports_status_created
  ON public.forum_reports (status, created_at DESC);

-- =========================================================
-- Moderation policies on topics & replies
-- =========================================================
DROP POLICY IF EXISTS "mods moderate topics" ON public.forum_topics;
CREATE POLICY "mods moderate topics" ON public.forum_topics
  FOR UPDATE USING (public.is_forum_mod(auth.uid()))
  WITH CHECK (public.is_forum_mod(auth.uid()));

DROP POLICY IF EXISTS "mods delete topics" ON public.forum_topics;
CREATE POLICY "mods delete topics" ON public.forum_topics
  FOR DELETE USING (public.is_forum_mod(auth.uid()));

DROP POLICY IF EXISTS "mods delete replies" ON public.forum_replies;
CREATE POLICY "mods delete replies" ON public.forum_replies
  FOR DELETE USING (public.is_forum_mod(auth.uid()));

-- Prevent replying to locked topics (safety net at DB level)
CREATE OR REPLACE FUNCTION public.block_reply_when_locked()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_locked boolean;
BEGIN
  SELECT is_locked INTO v_locked FROM public.forum_topics WHERE id = NEW.topic_id;
  IF v_locked THEN RAISE EXCEPTION 'topic_locked'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_block_reply_locked ON public.forum_replies;
CREATE TRIGGER trg_block_reply_locked BEFORE INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.block_reply_when_locked();

-- =========================================================
-- Notifications creation (SECURITY DEFINER helper + triggers)
-- =========================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid, _actor_id uuid, _type text, _title text, _body text, _link text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL OR _user_id = _actor_id THEN RETURN; END IF;
  INSERT INTO public.user_notifications(user_id, actor_id, type, title, body, link)
  VALUES (_user_id, _actor_id, _type, _title, _body, _link);
END; $$;

-- Reply → notify topic author + mentions + parent reply author
CREATE OR REPLACE FUNCTION public.on_forum_reply_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_topic RECORD;
  v_forum_slug text;
  v_link text;
  v_actor_name text;
  v_parent_author uuid;
  v_mention text;
  v_mentioned uuid;
BEGIN
  SELECT t.id, t.author_id, t.title, f.slug AS forum_slug
    INTO v_topic
    FROM public.forum_topics t JOIN public.forums f ON f.id = t.forum_id
    WHERE t.id = NEW.topic_id;
  v_link := '/forums/' || v_topic.forum_slug || '/' || v_topic.id;
  SELECT COALESCE(full_name,'عضو') INTO v_actor_name FROM public.profiles WHERE user_id = NEW.author_id;

  -- Topic author
  PERFORM public.create_notification(
    v_topic.author_id, NEW.author_id, 'reply_to_topic',
    v_actor_name || ' علّق على موضوعك',
    LEFT(NEW.content, 140), v_link);

  -- Parent reply author (if nested)
  IF NEW.parent_reply_id IS NOT NULL THEN
    SELECT author_id INTO v_parent_author FROM public.forum_replies WHERE id = NEW.parent_reply_id;
    PERFORM public.create_notification(
      v_parent_author, NEW.author_id, 'reply_to_reply',
      v_actor_name || ' ردّ على تعليقك',
      LEFT(NEW.content, 140), v_link);
  END IF;

  -- Mentions: @full_name (simple, case-insensitive, spaces->_ not required)
  FOR v_mention IN
    SELECT DISTINCT LOWER(m[1]) FROM regexp_matches(COALESCE(NEW.content,''), '@([A-Za-z0-9_\u0600-\u06FF]{2,40})', 'g') m
  LOOP
    SELECT user_id INTO v_mentioned FROM public.profiles
      WHERE LOWER(REPLACE(COALESCE(full_name,''), ' ', '_')) = v_mention
      LIMIT 1;
    IF v_mentioned IS NOT NULL THEN
      PERFORM public.create_notification(
        v_mentioned, NEW.author_id, 'mention',
        v_actor_name || ' أشار إليك',
        LEFT(NEW.content, 140), v_link);
    END IF;
  END LOOP;

  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_forum_reply_notify ON public.forum_replies;
CREATE TRIGGER trg_forum_reply_notify AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.on_forum_reply_notify();

-- =========================================================
-- Reputation (uses profiles.points; bypasses gamification guard)
-- =========================================================
CREATE OR REPLACE FUNCTION public.forum_add_points(_user_id uuid, _delta int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL OR _delta = 0 THEN RETURN; END IF;
  PERFORM set_config('app.bypass_gamification_check','true', true);
  UPDATE public.profiles
     SET points = GREATEST(COALESCE(points,0) + _delta, 0),
         updated_at = now()
   WHERE user_id = _user_id;
  PERFORM set_config('app.bypass_gamification_check','false', true);
END; $$;

-- Topic +2 (only for forum-created topics — not questions/articles tables)
CREATE OR REPLACE FUNCTION public.on_forum_topic_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.forum_add_points(NEW.author_id, 2); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_forum_topic_points ON public.forum_topics;
CREATE TRIGGER trg_forum_topic_points AFTER INSERT ON public.forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.on_forum_topic_points();

-- Reply +3
CREATE OR REPLACE FUNCTION public.on_forum_reply_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.forum_add_points(NEW.author_id, 3); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_forum_reply_points ON public.forum_replies;
CREATE TRIGGER trg_forum_reply_points AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.on_forum_reply_points();

-- Vote +/- 5 to target author (topic or reply)
CREATE OR REPLACE FUNCTION public.on_forum_vote_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old int := 0; v_new int := 0; v_delta int := 0; v_target_author uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN v_old := OLD.value; END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN v_new := NEW.value; END IF;
  IF TG_OP = 'DELETE' THEN v_old := OLD.value; END IF;
  v_delta := v_new - v_old;
  IF v_delta = 0 THEN RETURN COALESCE(NEW, OLD); END IF;

  IF COALESCE(NEW.topic_id, OLD.topic_id) IS NOT NULL THEN
    SELECT author_id INTO v_target_author FROM public.forum_topics WHERE id = COALESCE(NEW.topic_id, OLD.topic_id);
  ELSE
    SELECT author_id INTO v_target_author FROM public.forum_replies WHERE id = COALESCE(NEW.reply_id, OLD.reply_id);
  END IF;

  -- Convert vote delta into points: each +1 vote = +5, each -1 = -2. Approx: delta*5 upvote net.
  PERFORM public.forum_add_points(v_target_author, v_delta * 5);

  -- Notify upvote (only fresh upvotes)
  IF TG_OP = 'INSERT' AND NEW.value = 1 AND v_target_author IS NOT NULL THEN
    PERFORM public.create_notification(
      v_target_author, NEW.user_id, 'vote_received',
      'تصويت إيجابي جديد', 'حصلت على تصويت إيجابي على مساهمتك', NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
DROP TRIGGER IF EXISTS trg_forum_vote_points ON public.forum_votes;
CREATE TRIGGER trg_forum_vote_points AFTER INSERT OR UPDATE OR DELETE ON public.forum_votes
  FOR EACH ROW EXECUTE FUNCTION public.on_forum_vote_points();

-- Update mark_forum_solution to award +15 and notify solver
CREATE OR REPLACE FUNCTION public.mark_forum_solution(p_reply_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_topic uuid; v_topic_title text; v_forum_slug text;
  v_topic_author uuid; v_reply_author uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'auth'); END IF;
  SELECT r.topic_id, r.author_id INTO v_topic, v_reply_author FROM public.forum_replies r WHERE r.id = p_reply_id;
  IF v_topic IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  SELECT t.author_id, t.title, f.slug INTO v_topic_author, v_topic_title, v_forum_slug
    FROM public.forum_topics t JOIN public.forums f ON f.id=t.forum_id WHERE t.id = v_topic;
  IF v_topic_author <> v_uid AND NOT public.is_forum_mod(v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;
  UPDATE public.forum_replies SET is_solution = false WHERE topic_id = v_topic;
  UPDATE public.forum_replies SET is_solution = true WHERE id = p_reply_id;
  UPDATE public.forum_topics SET status='solved', solved_reply_id=p_reply_id WHERE id = v_topic;
  PERFORM public.forum_add_points(v_reply_author, 15);
  PERFORM public.create_notification(
    v_reply_author, v_uid, 'topic_solved',
    'تم اختيار ردك كحل ✓', v_topic_title,
    '/forums/' || v_forum_slug || '/' || v_topic);
  RETURN jsonb_build_object('success', true);
END; $$;

-- =========================================================
-- Indexes
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_forum_topics_forum_activity ON public.forum_topics (forum_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_status ON public.forum_topics (status);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author ON public.forum_topics (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic ON public.forum_replies (topic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON public.forum_replies (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_topic ON public.forum_votes (topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_reply ON public.forum_votes (reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_bookmarks_user ON public.forum_bookmarks (user_id);

-- =========================================================
-- Realtime
-- =========================================================
ALTER TABLE public.forum_topics REPLICA IDENTITY FULL;
ALTER TABLE public.forum_replies REPLICA IDENTITY FULL;
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_topics;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_replies;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
