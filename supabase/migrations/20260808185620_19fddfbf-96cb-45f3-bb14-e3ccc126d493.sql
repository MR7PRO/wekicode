-- ============ 1. PROFILE FIELDS ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_goal text,
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS preferred_tracks text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS portfolio_url text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- ============ 2. FOLLOWS ============
CREATE TABLE IF NOT EXISTS public.forum_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forum_id uuid NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, forum_id)
);
GRANT SELECT, INSERT, DELETE ON public.forum_follows TO authenticated;
GRANT ALL ON public.forum_follows TO service_role;
ALTER TABLE public.forum_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own follows select" ON public.forum_follows FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own follows insert" ON public.forum_follows FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own follows delete" ON public.forum_follows FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_forum_follows_user ON public.forum_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_follows_forum ON public.forum_follows(forum_id);

CREATE TABLE IF NOT EXISTS public.tag_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.forum_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag_id)
);
GRANT SELECT, INSERT, DELETE ON public.tag_follows TO authenticated;
GRANT ALL ON public.tag_follows TO service_role;
ALTER TABLE public.tag_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tag follows select" ON public.tag_follows FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own tag follows insert" ON public.tag_follows FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tag follows delete" ON public.tag_follows FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_tag_follows_user ON public.tag_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_follows_tag ON public.tag_follows(tag_id);

-- ============ 3. ACHIEVEMENTS ============
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  icon text,
  points_reward integer NOT NULL DEFAULT 0,
  rarity text NOT NULL DEFAULT 'common',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievement_definitions TO anon, authenticated;
GRANT ALL ON public.achievement_definitions TO service_role;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active achievements readable" ON public.achievement_definitions FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage achievements" ON public.achievement_definitions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  progress integer NOT NULL DEFAULT 100,
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT ON public.user_achievements TO anon, authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
-- Earned badges are public (shown on public profiles); no client writes allowed at all.
CREATE POLICY "earned achievements readable" ON public.user_achievements FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- ============ 4. STREAKS ============
CREATE TABLE IF NOT EXISTS public.user_activity_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  weekly_points integer NOT NULL DEFAULT 0,
  week_start date NOT NULL DEFAULT date_trunc('week', now())::date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_activity_streaks TO authenticated;
GRANT ALL ON public.user_activity_streaks TO service_role;
ALTER TABLE public.user_activity_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own streak readable" ON public.user_activity_streaks FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============ 5. INVITES ============
CREATE TABLE IF NOT EXISTS public.user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  invited_email text,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  rewarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_invites TO authenticated;
GRANT ALL ON public.user_invites TO service_role;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invites readable" ON public.user_invites FOR SELECT TO authenticated USING (inviter_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_user_invites_inviter ON public.user_invites(inviter_id);

-- ============ 6. DISMISSED NUDGES ============
CREATE TABLE IF NOT EXISTS public.user_dismissed_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_key text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nudge_key)
);
GRANT SELECT, INSERT, DELETE ON public.user_dismissed_nudges TO authenticated;
GRANT ALL ON public.user_dismissed_nudges TO service_role;
ALTER TABLE public.user_dismissed_nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own nudges select" ON public.user_dismissed_nudges FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own nudges insert" ON public.user_dismissed_nudges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own nudges delete" ON public.user_dismissed_nudges FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ 7. FEATURE FLAGS ============
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  audience text NOT NULL DEFAULT 'all',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flags readable" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "admins manage flags" ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER feature_flags_updated BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 8. CONTROLLED FUNCTIONS ============

-- Award a single achievement idempotently (internal use only).
CREATE OR REPLACE FUNCTION public.grant_achievement(_user_id uuid, _slug text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_def RECORD; v_new boolean := false;
BEGIN
  SELECT * INTO v_def FROM public.achievement_definitions WHERE slug = _slug AND is_active = true;
  IF NOT FOUND OR _user_id IS NULL THEN RETURN false; END IF;
  INSERT INTO public.user_achievements(user_id, achievement_id) VALUES (_user_id, v_def.id)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
  GET DIAGNOSTICS v_new = ROW_COUNT;
  IF v_new THEN
    IF v_def.points_reward > 0 THEN
      PERFORM public.forum_add_points(_user_id, v_def.points_reward);
    END IF;
    PERFORM public.create_notification(_user_id, NULL, 'achievement_earned',
      'حصلت على شارة جديدة 🎖️', v_def.title, '/achievements');
  END IF;
  RETURN v_new;
END; $$;
REVOKE ALL ON FUNCTION public.grant_achievement(uuid, text) FROM public, anon, authenticated;

-- Evaluate real activity for the caller and award any earned badges.
CREATE OR REPLACE FUNCTION public.sync_my_achievements()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_p RECORD;
  v_topics int; v_replies int; v_votes int; v_follows int;
  v_solutions int; v_articles int; v_freelance int; v_reports int;
  v_awarded text[] := '{}';
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'auth'); END IF;
  SELECT * INTO v_p FROM public.profiles WHERE user_id = v_uid;

  SELECT count(*) INTO v_topics FROM public.forum_topics WHERE author_id = v_uid;
  SELECT count(*) INTO v_replies FROM public.forum_replies WHERE author_id = v_uid;
  SELECT count(*) INTO v_solutions FROM public.forum_replies WHERE author_id = v_uid AND is_solution = true;
  SELECT count(*) INTO v_votes FROM public.forum_votes WHERE user_id = v_uid;
  SELECT (SELECT count(*) FROM public.forum_follows WHERE user_id = v_uid)
       + (SELECT count(*) FROM public.tag_follows WHERE user_id = v_uid) INTO v_follows;
  SELECT count(*) INTO v_articles FROM public.knowledge_articles WHERE author_id = v_uid;
  SELECT count(*) INTO v_freelance FROM public.forum_topics t
    JOIN public.forums f ON f.id = t.forum_id
    WHERE t.author_id = v_uid AND (f.slug ILIKE '%freelance%' OR f.slug ILIKE '%jobs%' OR f.slug ILIKE '%career%');
  SELECT count(*) INTO v_reports FROM public.forum_reports r
    LEFT JOIN public.forum_topics t ON t.id = r.topic_id
    LEFT JOIN public.forum_replies rp ON rp.id = r.reply_id
    WHERE (t.author_id = v_uid OR rp.author_id = v_uid);

  -- البداية
  IF v_topics >= 1 AND public.grant_achievement(v_uid, 'first_question') THEN v_awarded := v_awarded || 'first_question'; END IF;
  IF v_replies >= 1 AND public.grant_achievement(v_uid, 'first_reply') THEN v_awarded := v_awarded || 'first_reply'; END IF;
  IF v_votes >= 1 AND public.grant_achievement(v_uid, 'first_vote') THEN v_awarded := v_awarded || 'first_vote'; END IF;
  IF v_follows >= 1 AND public.grant_achievement(v_uid, 'first_follow') THEN v_awarded := v_awarded || 'first_follow'; END IF;
  IF v_p.full_name IS NOT NULL AND COALESCE(v_p.bio,'') <> '' AND coalesce(array_length(v_p.skills,1),0) > 0
     AND v_p.avatar_url IS NOT NULL AND public.grant_achievement(v_uid, 'profile_complete')
     THEN v_awarded := v_awarded || 'profile_complete'; END IF;

  -- حل المشكلات (quality: solutions + upvoted replies)
  IF v_solutions >= 1 AND public.grant_achievement(v_uid, 'first_solution') THEN v_awarded := v_awarded || 'first_solution'; END IF;
  IF v_solutions >= 5 AND public.grant_achievement(v_uid, 'five_solutions') THEN v_awarded := v_awarded || 'five_solutions'; END IF;
  IF v_solutions >= 20 AND public.grant_achievement(v_uid, 'solution_expert') THEN v_awarded := v_awarded || 'solution_expert'; END IF;
  IF EXISTS (SELECT 1 FROM public.forum_replies WHERE author_id = v_uid AND score >= 5)
     AND public.grant_achievement(v_uid, 'helpful_answer') THEN v_awarded := v_awarded || 'helpful_answer'; END IF;

  -- المعرفة
  IF v_articles >= 1 AND public.grant_achievement(v_uid, 'first_article') THEN v_awarded := v_awarded || 'first_article'; END IF;
  IF v_articles >= 3 AND public.grant_achievement(v_uid, 'library_contributor') THEN v_awarded := v_awarded || 'library_contributor'; END IF;
  IF EXISTS (SELECT 1 FROM public.forum_topics WHERE author_id = v_uid AND type = 'article' AND score >= 5)
     AND public.grant_achievement(v_uid, 'useful_article') THEN v_awarded := v_awarded || 'useful_article'; END IF;

  -- الفريلانس
  IF v_freelance >= 1 AND public.grant_achievement(v_uid, 'first_freelance_topic') THEN v_awarded := v_awarded || 'first_freelance_topic'; END IF;
  IF COALESCE(v_p.portfolio_url, v_p.website_url, v_p.github_url) IS NOT NULL
     AND public.grant_achievement(v_uid, 'portfolio_builder') THEN v_awarded := v_awarded || 'portfolio_builder'; END IF;
  IF v_freelance >= 5 AND public.grant_achievement(v_uid, 'pricing_advisor') THEN v_awarded := v_awarded || 'pricing_advisor'; END IF;

  -- المجتمع
  IF COALESCE(v_p.points,0) >= 100 AND public.grant_achievement(v_uid, 'active_member') THEN v_awarded := v_awarded || 'active_member'; END IF;
  IF COALESCE((SELECT current_streak FROM public.user_activity_streaks WHERE user_id = v_uid),0) >= 7
     AND public.grant_achievement(v_uid, 'week_of_activity') THEN v_awarded := v_awarded || 'week_of_activity'; END IF;
  IF v_reports = 0 AND (v_topics + v_replies) >= 10 AND public.grant_achievement(v_uid, 'respected_member')
     THEN v_awarded := v_awarded || 'respected_member'; END IF;
  IF EXISTS (SELECT 1 FROM public.forum_topics WHERE author_id = v_uid AND replies_count >= 5)
     AND public.grant_achievement(v_uid, 'discussion_starter') THEN v_awarded := v_awarded || 'discussion_starter'; END IF;

  -- الجودة
  IF EXISTS (SELECT 1 FROM public.forum_topics WHERE author_id = v_uid AND score >= 10)
     AND public.grant_achievement(v_uid, 'high_quality_topic') THEN v_awarded := v_awarded || 'high_quality_topic'; END IF;
  IF EXISTS (SELECT 1 FROM public.forum_replies WHERE author_id = v_uid AND length(content) >= 400 AND score >= 3)
     AND public.grant_achievement(v_uid, 'documented_reply') THEN v_awarded := v_awarded || 'documented_reply'; END IF;
  IF v_reports = 0 AND v_p.created_at < now() - interval '30 days' AND (v_topics + v_replies) >= 20
     AND public.grant_achievement(v_uid, 'clean_record') THEN v_awarded := v_awarded || 'clean_record'; END IF;

  RETURN jsonb_build_object('success', true, 'awarded', to_jsonb(v_awarded));
END; $$;
GRANT EXECUTE ON FUNCTION public.sync_my_achievements() TO authenticated;

-- Record a meaningful activity for the caller (streak + weekly points, capped).
CREATE OR REPLACE FUNCTION public.record_activity(_kind text, _points integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_week date := date_trunc('week', now())::date;
  v_row RECORD;
  v_pts integer := LEAST(GREATEST(COALESCE(_points,1), 0), 10); -- anti-abuse cap per call
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;
  IF _kind IS NULL OR _kind NOT IN ('topic','reply','solution','article','follow','vote') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_kind');
  END IF;

  INSERT INTO public.user_activity_streaks(user_id, current_streak, longest_streak, last_active_date, weekly_points, week_start)
  VALUES (v_uid, 1, 1, v_today, v_pts, v_week)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row FROM public.user_activity_streaks WHERE user_id = v_uid FOR UPDATE;

  IF v_row.last_active_date IS DISTINCT FROM v_today THEN
    IF v_row.last_active_date = v_today - 1 THEN
      v_row.current_streak := v_row.current_streak + 1;
    ELSE
      v_row.current_streak := 1;
    END IF;
  END IF;

  UPDATE public.user_activity_streaks SET
    current_streak = v_row.current_streak,
    longest_streak = GREATEST(v_row.longest_streak, v_row.current_streak),
    last_active_date = v_today,
    weekly_points = CASE WHEN v_row.week_start = v_week THEN LEAST(v_row.weekly_points + v_pts, 500) ELSE v_pts END,
    week_start = v_week,
    updated_at = now()
  WHERE user_id = v_uid;

  RETURN jsonb_build_object('success', true, 'current_streak', v_row.current_streak);
END; $$;
GRANT EXECUTE ON FUNCTION public.record_activity(text, integer) TO authenticated;

-- Create (or fetch) the caller's invite code. Max 5 codes per user.
CREATE OR REPLACE FUNCTION public.get_or_create_invite_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_code text;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;
  SELECT code INTO v_code FROM public.user_invites WHERE inviter_id = v_uid AND used_by IS NULL ORDER BY created_at LIMIT 1;
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;
  IF (SELECT count(*) FROM public.user_invites WHERE inviter_id = v_uid) >= 5 THEN RETURN NULL; END IF;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO public.user_invites(inviter_id, code) VALUES (v_uid, v_code);
  RETURN v_code;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_or_create_invite_code() TO authenticated;

-- Redeem an invite code. Reward is only granted once the invitee finishes onboarding.
CREATE OR REPLACE FUNCTION public.redeem_invite_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_inv RECORD;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'auth'); END IF;
  SELECT * INTO v_inv FROM public.user_invites WHERE code = upper(trim(_code)) FOR UPDATE;
  IF NOT FOUND OR v_inv.used_by IS NOT NULL OR v_inv.inviter_id = v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_invites WHERE used_by = v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_redeemed');
  END IF;
  UPDATE public.user_invites SET used_by = v_uid, used_at = now(), rewarded = true WHERE id = v_inv.id;
  PERFORM public.forum_add_points(v_inv.inviter_id, 25);
  PERFORM public.create_notification(v_inv.inviter_id, v_uid, 'invite_used',
    'تم استخدام دعوتك 🎉', 'انضم عضو جديد عبر رابط دعوتك وحصلت على 25 نقطة', '/profile');
  RETURN jsonb_build_object('success', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(text) TO authenticated;

-- Admin-only community metrics.
CREATE OR REPLACE FUNCTION public.admin_insights()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_res jsonb;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'new_users_week', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '7 days'),
    'active_users_week', (SELECT count(*) FROM public.user_activity_streaks WHERE last_active_date >= (now() - interval '7 days')::date),
    'topics_week', (SELECT count(*) FROM public.forum_topics WHERE created_at >= now() - interval '7 days'),
    'replies_week', (SELECT count(*) FROM public.forum_replies WHERE created_at >= now() - interval '7 days'),
    'solved_topics', (SELECT count(*) FROM public.forum_topics WHERE status = 'solved'),
    'unanswered_topics', (SELECT count(*) FROM public.forum_topics WHERE replies_count = 0),
    'reports_pending', (SELECT count(*) FROM public.forum_reports WHERE status = 'pending'),
    'ai_usage', (SELECT count(*) FROM public.ai_usage_logs WHERE created_at >= now() - interval '7 days'),
    'onboarding_rate', (SELECT CASE WHEN count(*) = 0 THEN 0
        ELSE round(100.0 * count(*) FILTER (WHERE onboarding_completed) / count(*)) END FROM public.profiles),
    'achievements_earned', (SELECT count(*) FROM public.user_achievements),
    'top_tags', (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM
        (SELECT name, usage_count FROM public.forum_tags ORDER BY usage_count DESC LIMIT 8) x),
    'top_forums', (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM
        (SELECT f.title, count(t.id) AS topics FROM public.forums f
         LEFT JOIN public.forum_topics t ON t.forum_id = f.id
         GROUP BY f.id, f.title ORDER BY count(t.id) DESC LIMIT 8) x),
    'most_followed_tags', (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM
        (SELECT g.name, count(tf.id) AS followers FROM public.forum_tags g
         JOIN public.tag_follows tf ON tf.tag_id = g.id
         GROUP BY g.id, g.name ORDER BY count(tf.id) DESC LIMIT 5) x),
    'most_followed_forums', (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM
        (SELECT f.title AS name, count(ff.id) AS followers FROM public.forums f
         JOIN public.forum_follows ff ON ff.forum_id = f.id
         GROUP BY f.id, f.title ORDER BY count(ff.id) DESC LIMIT 5) x)
  ) INTO v_res;
  RETURN v_res;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_insights() TO authenticated;

-- ============ 9. SEED ============
INSERT INTO public.achievement_definitions (slug, title, description, category, icon, points_reward, rarity) VALUES
  ('first_question','أول سؤال','طرحت أول سؤال في المجتمع','البداية','HelpCircle',10,'common'),
  ('first_reply','أول رد','شاركت بأول رد مفيد','البداية','MessageSquare',10,'common'),
  ('first_vote','أول تصويت','قيّمت أول مساهمة','البداية','ThumbsUp',5,'common'),
  ('first_follow','أول متابعة','تابعت أول قسم أو وسم','البداية','Bell',5,'common'),
  ('profile_complete','أكملت ملفك الشخصي','صورة، نبذة، ومهارات مكتملة','البداية','UserCheck',20,'common'),
  ('helpful_answer','إجابة مفيدة','حصل ردك على 5 تصويتات إيجابية','حل المشكلات','Sparkles',25,'uncommon'),
  ('first_solution','أول حل معتمد','تم اعتماد ردك كحل','حل المشكلات','CheckCircle2',30,'uncommon'),
  ('five_solutions','5 حلول معتمدة','ساعدت 5 أعضاء بحلول معتمدة','حل المشكلات','ShieldCheck',75,'rare'),
  ('solution_expert','خبير حلول','20 حلًا معتمدًا في المجتمع','حل المشكلات','Crown',200,'legendary'),
  ('first_article','أول مقال','نشرت أول مقال معرفي','المعرفة','FileText',20,'common'),
  ('useful_article','مقال مفيد','مقالك حصل على تفاعل إيجابي','المعرفة','BookOpen',40,'uncommon'),
  ('library_contributor','مساهم في المكتبة','3 مقالات في مكتبة المعرفة','المعرفة','Library',80,'rare'),
  ('first_freelance_topic','أول نقاش فريلانس','بدأت نقاشًا في أقسام الفريلانس','الفريلانس','Briefcase',15,'common'),
  ('portfolio_builder','باني بورتفوليو','أضفت رابط أعمالك للملف الشخصي','الفريلانس','Globe',15,'common'),
  ('pricing_advisor','مستشار تسعير','5 مساهمات في نقاشات الفريلانس','الفريلانس','DollarSign',60,'rare'),
  ('active_member','عضو نشط','وصلت إلى 100 نقطة سمعة','المجتمع','Flame',0,'common'),
  ('week_of_activity','أسبوع من النشاط','7 أيام متتالية من المساهمة','المجتمع','CalendarCheck',50,'uncommon'),
  ('respected_member','مساهم محترم','10 مساهمات بدون أي بلاغ','المجتمع','Handshake',40,'uncommon'),
  ('discussion_starter','صانع نقاشات','موضوع لك تجاوز 5 ردود','المجتمع','MessagesSquare',30,'uncommon'),
  ('high_quality_topic','موضوع عالي الجودة','موضوع حصل على 10 نقاط تصويت','الجودة','Star',60,'rare'),
  ('documented_reply','رد موثق','رد مفصّل وموثق حصل على تفاعل','الجودة','ClipboardCheck',40,'uncommon'),
  ('clean_record','سجل نظيف','شهر كامل من المساهمة بدون بلاغات','الجودة','ShieldCheck',100,'rare')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('onboarding', true, 'تجربة الإعداد الأولي للأعضاء الجدد'),
  ('achievements', true, 'نظام الشارات والإنجازات'),
  ('referrals', true, 'نظام الدعوات'),
  ('leaderboards', true, 'صفحة المتصدرين'),
  ('ai_tools', true, 'أدوات الذكاء الاصطناعي'),
  ('public_knowledge', true, 'مكتبة المعرفة العامة'),
  ('semantic_search', false, 'البحث الدلالي (قيد التطوير)')
ON CONFLICT (key) DO NOTHING;