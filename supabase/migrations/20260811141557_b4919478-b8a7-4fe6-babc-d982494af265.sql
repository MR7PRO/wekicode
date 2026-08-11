-- ============ staff roles ============
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('support_agent','trust_safety','professional_reviewer','legal_editor')),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.staff_roles TO authenticated;
GRANT ALL ON public.staff_roles TO service_role;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_staff_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff_roles WHERE user_id = _user_id AND role = _role)
      OR public.has_role(_user_id, 'admin'::public.app_role)
$$;

CREATE OR REPLACE FUNCTION public.is_ts_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR EXISTS (SELECT 1 FROM public.staff_roles WHERE user_id = _user_id AND role = 'trust_safety')
$$;

CREATE POLICY "own staff roles readable" ON public.staff_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "admins manage staff roles" ON public.staff_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

-- ============ verifications ============
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('email','phone','professional_profile','identity','payment_account','business')),
  provider text,
  provider_reference text,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','pending','action_required','under_review','approved','rejected','expired','suspended')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  rejection_code text,
  rejection_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, verification_type)
);
GRANT SELECT ON public.user_verifications TO authenticated;
GRANT ALL ON public.user_verifications TO service_role;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own verifications" ON public.user_verifications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_ts_staff(auth.uid()));
CREATE POLICY "staff manage verifications" ON public.user_verifications
  FOR ALL TO authenticated USING (public.is_ts_staff(auth.uid())) WITH CHECK (public.is_ts_staff(auth.uid()));
CREATE TRIGGER trg_user_verifications_updated BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_user_verifications_user ON public.user_verifications(user_id, verification_type);

CREATE OR REPLACE VIEW public.public_profile_verification_summary
WITH (security_invoker = off) AS
SELECT
  p.user_id,
  COALESCE(bool_or(v.verification_type = 'email' AND v.status = 'approved'), false) AS email_verified,
  COALESCE(bool_or(v.verification_type = 'phone' AND v.status = 'approved'), false) AS phone_verified,
  COALESCE(bool_or(v.verification_type = 'professional_profile' AND v.status = 'approved'), false) AS professional_verified,
  COALESCE(bool_or(v.verification_type = 'identity' AND v.status = 'approved'), false) AS identity_verified,
  COALESCE(bool_or(v.verification_type = 'payment_account' AND v.status = 'approved'), false) AS payment_verified
FROM public.profiles p
LEFT JOIN public.user_verifications v ON v.user_id = p.user_id
GROUP BY p.user_id;
GRANT SELECT ON public.public_profile_verification_summary TO anon, authenticated;

-- ============ professional verification requests ============
CREATE TABLE IF NOT EXISTS public.professional_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','changes_requested','approved','rejected','suspended')),
  portfolio_links text[] NOT NULL DEFAULT '{}',
  work_samples text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  notes text,
  reviewer_notes text,
  standards_accepted boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.professional_verification_requests TO authenticated;
GRANT ALL ON public.professional_verification_requests TO service_role;
ALTER TABLE public.professional_verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own pro requests" ON public.professional_verification_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_staff_role(auth.uid(),'professional_reviewer') OR public.is_ts_staff(auth.uid()));
CREATE POLICY "create own pro request" ON public.professional_verification_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status IN ('draft','submitted'));
CREATE POLICY "update own editable pro request" ON public.professional_verification_requests
  FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status IN ('draft','changes_requested','rejected'))
  WITH CHECK (user_id = auth.uid() AND status IN ('draft','submitted'));
CREATE POLICY "reviewers manage pro requests" ON public.professional_verification_requests
  FOR ALL TO authenticated USING (public.has_staff_role(auth.uid(),'professional_reviewer') OR public.is_ts_staff(auth.uid()))
  WITH CHECK (public.has_staff_role(auth.uid(),'professional_reviewer') OR public.is_ts_staff(auth.uid()));
CREATE TRIGGER trg_pro_requests_updated BEFORE UPDATE ON public.professional_verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- prevent users touching reviewer fields
CREATE OR REPLACE FUNCTION public.guard_pro_request_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_staff_role(auth.uid(),'professional_reviewer') OR public.is_ts_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.reviewer_notes := OLD.reviewer_notes;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.reviewed_by := OLD.reviewed_by;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_pro_requests_guard BEFORE UPDATE ON public.professional_verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_pro_request_fields();

-- ============ seller levels & trust score ============
CREATE TABLE IF NOT EXISTS public.seller_level_status (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level text NOT NULL DEFAULT 'new' CHECK (current_level IN ('new','active','professional','elite','partner')),
  trust_score integer NOT NULL DEFAULT 0,
  has_enough_data boolean NOT NULL DEFAULT false,
  completed_orders_count integer NOT NULL DEFAULT 0,
  cancelled_orders_count integer NOT NULL DEFAULT 0,
  disputed_orders_count integer NOT NULL DEFAULT 0,
  on_time_delivery_rate numeric NOT NULL DEFAULT 0,
  response_rate numeric NOT NULL DEFAULT 0,
  average_response_minutes integer,
  average_rating numeric NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  policy_warnings_count integer NOT NULL DEFAULT 0,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  next_level_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seller_level_status TO anon, authenticated;
GRANT ALL ON public.seller_level_status TO service_role;
ALTER TABLE public.seller_level_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seller level readable" ON public.seller_level_status FOR SELECT USING (true);
CREATE POLICY "staff manage seller level" ON public.seller_level_status
  FOR ALL TO authenticated USING (public.is_ts_staff(auth.uid())) WITH CHECK (public.is_ts_staff(auth.uid()));
CREATE TRIGGER trg_seller_level_updated BEFORE UPDATE ON public.seller_level_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.trust_score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points_change integer NOT NULL,
  source_type text,
  source_id uuid,
  reason text,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trust_score_events TO authenticated;
GRANT ALL ON public.trust_score_events TO service_role;
ALTER TABLE public.trust_score_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own trust events" ON public.trust_score_events
  FOR SELECT TO authenticated USING ((user_id = auth.uid() AND is_internal = false) OR public.is_ts_staff(auth.uid()));
CREATE POLICY "staff manage trust events" ON public.trust_score_events
  FOR ALL TO authenticated USING (public.is_ts_staff(auth.uid())) WITH CHECK (public.is_ts_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_trust_events_user ON public.trust_score_events(user_id, created_at DESC);

-- controlled recalculation
CREATE OR REPLACE FUNCTION public.recalculate_seller_trust(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_profile record; v_completed int; v_cancelled int; v_disputed int;
  v_rating numeric; v_reviews int; v_score int := 0; v_level text := 'new';
  v_completeness int := 0; v_pro boolean; v_points int; v_enough boolean;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN '{}'::jsonb; END IF;

  SELECT count(*) FILTER (WHERE status = 'completed'),
         count(*) FILTER (WHERE status = 'cancelled'),
         count(*) FILTER (WHERE status = 'disputed')
  INTO v_completed, v_cancelled, v_disputed
  FROM public.marketplace_orders WHERE seller_id = p_user_id;

  SELECT COALESCE(avg(rating),0), count(*) INTO v_rating, v_reviews
  FROM public.marketplace_reviews WHERE reviewee_id = p_user_id AND is_hidden = false;

  v_pro := EXISTS (SELECT 1 FROM public.user_verifications
    WHERE user_id = p_user_id AND verification_type = 'professional_profile' AND status = 'approved');
  v_points := COALESCE(v_profile.points, 0);

  IF v_profile.full_name IS NOT NULL THEN v_completeness := v_completeness + 2; END IF;
  IF v_profile.username IS NOT NULL THEN v_completeness := v_completeness + 2; END IF;
  IF v_profile.avatar_url IS NOT NULL THEN v_completeness := v_completeness + 2; END IF;
  IF v_profile.bio IS NOT NULL THEN v_completeness := v_completeness + 2; END IF;
  IF v_profile.skills IS NOT NULL AND array_length(v_profile.skills,1) >= 3 THEN v_completeness := v_completeness + 2; END IF;

  v_score := v_completeness
    + CASE WHEN v_pro THEN 15 ELSE 0 END
    + LEAST(20, (v_rating * 4)::int)
    + LEAST(10, v_completed)
    + GREATEST(0, 10 - (v_cancelled * 3) - (v_disputed * 5))
    + LEAST(10, v_points / 100);
  v_score := GREATEST(0, LEAST(100, v_score));
  v_enough := (v_completed >= 3 OR v_reviews >= 3);

  v_level := CASE
    WHEN v_completed >= 50 AND v_rating >= 4.8 AND v_pro THEN 'partner'
    WHEN v_completed >= 20 AND v_rating >= 4.6 AND v_pro THEN 'elite'
    WHEN v_completed >= 8 AND v_rating >= 4.3 THEN 'professional'
    WHEN v_completed >= 2 THEN 'active'
    ELSE 'new' END;

  INSERT INTO public.seller_level_status AS s (user_id, current_level, trust_score, has_enough_data,
    completed_orders_count, cancelled_orders_count, disputed_orders_count,
    average_rating, reviews_count, last_calculated_at, next_level_progress)
  VALUES (p_user_id, v_level, v_score, v_enough, v_completed, v_cancelled, v_disputed,
    round(v_rating,2), v_reviews, now(),
    jsonb_build_object('completed_orders', v_completed, 'average_rating', round(v_rating,2), 'professional_verified', v_pro))
  ON CONFLICT (user_id) DO UPDATE SET
    current_level = EXCLUDED.current_level, trust_score = EXCLUDED.trust_score,
    has_enough_data = EXCLUDED.has_enough_data,
    completed_orders_count = EXCLUDED.completed_orders_count,
    cancelled_orders_count = EXCLUDED.cancelled_orders_count,
    disputed_orders_count = EXCLUDED.disputed_orders_count,
    average_rating = EXCLUDED.average_rating, reviews_count = EXCLUDED.reviews_count,
    last_calculated_at = now(), next_level_progress = EXCLUDED.next_level_progress;

  RETURN jsonb_build_object('level', v_level, 'trust_score', v_score, 'has_enough_data', v_enough);
END; $$;
GRANT EXECUTE ON FUNCTION public.recalculate_seller_trust(uuid) TO authenticated;

-- ============ restrictions & appeals ============
CREATE TABLE IF NOT EXISTS public.account_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type text NOT NULL CHECK (restriction_type IN ('warning','marketplace_listing_block','proposal_block','messaging_block','payment_hold','verification_suspension','temporary_account_suspension','permanent_account_suspension')),
  scope text NOT NULL CHECK (scope IN ('community','marketplace','messaging','payments','entire_account')),
  reason_code text NOT NULL,
  internal_reason text,
  public_message text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  lifted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  lifted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.account_restrictions TO authenticated;
GRANT ALL ON public.account_restrictions TO service_role;
ALTER TABLE public.account_restrictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own restrictions" ON public.account_restrictions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_ts_staff(auth.uid()));
CREATE POLICY "staff manage restrictions" ON public.account_restrictions
  FOR ALL TO authenticated USING (public.is_ts_staff(auth.uid())) WITH CHECK (public.is_ts_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_restrictions_user_active ON public.account_restrictions(user_id, is_active);

CREATE TABLE IF NOT EXISTS public.account_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_id uuid REFERENCES public.account_restrictions(id) ON DELETE CASCADE,
  explanation text NOT NULL,
  attachments text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','more_information_required','approved','rejected','closed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_response text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.account_appeals TO authenticated;
GRANT ALL ON public.account_appeals TO service_role;
ALTER TABLE public.account_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own appeals" ON public.account_appeals
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_ts_staff(auth.uid()));
CREATE POLICY "create own appeal" ON public.account_appeals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'submitted');
CREATE POLICY "staff manage appeals" ON public.account_appeals
  FOR ALL TO authenticated USING (public.is_ts_staff(auth.uid())) WITH CHECK (public.is_ts_staff(auth.uid()));

-- ============ help center ============
CREATE TABLE IF NOT EXISTS public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  display_order integer NOT NULL DEFAULT 0,
  related_article_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.help_articles TO anon, authenticated;
GRANT ALL ON public.help_articles TO service_role;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published help readable" ON public.help_articles FOR SELECT USING (status = 'published');
CREATE POLICY "editors read all help" ON public.help_articles
  FOR SELECT TO authenticated USING (public.has_staff_role(auth.uid(),'legal_editor') OR public.has_staff_role(auth.uid(),'support_agent'));
CREATE POLICY "editors manage help" ON public.help_articles
  FOR ALL TO authenticated USING (public.has_staff_role(auth.uid(),'legal_editor')) WITH CHECK (public.has_staff_role(auth.uid(),'legal_editor'));
CREATE TRIGGER trg_help_articles_updated BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.help_article_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.help_articles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  was_helpful boolean NOT NULL,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_help_feedback_once ON public.help_article_feedback(article_id, user_id) WHERE user_id IS NOT NULL;
GRANT SELECT, INSERT ON public.help_article_feedback TO authenticated;
GRANT ALL ON public.help_article_feedback TO service_role;
ALTER TABLE public.help_article_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert own help feedback" ON public.help_article_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "read own help feedback" ON public.help_article_feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_staff_role(auth.uid(),'support_agent'));

-- ============ support tickets ============
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','waiting_on_user','waiting_on_support','resolved','closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  related_order_id uuid,
  related_dispute_id uuid,
  attachments text[] NOT NULL DEFAULT '{}',
  first_response_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_staff_role(auth.uid(),'support_agent') OR public.is_ts_staff(auth.uid()));
CREATE POLICY "create own ticket" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'open' AND priority IN ('low','normal'));
CREATE POLICY "support manage tickets" ON public.support_tickets
  FOR ALL TO authenticated USING (public.has_staff_role(auth.uid(),'support_agent') OR public.is_ts_staff(auth.uid()))
  WITH CHECK (public.has_staff_role(auth.uid(),'support_agent') OR public.is_ts_staff(auth.uid()));
CREATE TRIGGER trg_support_tickets_updated BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, priority);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user','support','system')),
  message text NOT NULL,
  attachments text[] NOT NULL DEFAULT '{}',
  is_internal_note boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read permitted ticket messages" ON public.support_ticket_messages
  FOR SELECT TO authenticated USING (
    (is_internal_note = false AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()))
    OR public.has_staff_role(auth.uid(),'support_agent') OR public.is_ts_staff(auth.uid()));
CREATE POLICY "reply to own ticket" ON public.support_ticket_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND is_internal_note = false AND sender_type = 'user'
    AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid() AND t.status <> 'closed'));
CREATE POLICY "support write ticket messages" ON public.support_ticket_messages
  FOR INSERT TO authenticated WITH CHECK (public.has_staff_role(auth.uid(),'support_agent') OR public.is_ts_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.support_ticket_messages(ticket_id, created_at);

-- ============ legal ============
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_key text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review_required','published','archived')),
  effective_at timestamptz,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_key, version)
);
GRANT SELECT ON public.legal_documents TO anon, authenticated;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published legal readable" ON public.legal_documents FOR SELECT USING (status = 'published');
CREATE POLICY "legal editors manage" ON public.legal_documents
  FOR ALL TO authenticated USING (public.has_staff_role(auth.uid(),'legal_editor')) WITH CHECK (public.has_staff_role(auth.uid(),'legal_editor'));
CREATE TRIGGER trg_legal_documents_updated BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_legal_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_key text NOT NULL,
  document_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_key, document_version)
);
GRANT SELECT, INSERT ON public.user_legal_consents TO authenticated;
GRANT ALL ON public.user_legal_consents TO service_role;
ALTER TABLE public.user_legal_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own consents" ON public.user_legal_consents
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "create own consent" ON public.user_legal_consents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============ privacy, exports, deletion ============
CREATE TABLE IF NOT EXISTS public.user_privacy_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  analytics_enabled boolean NOT NULL DEFAULT false,
  personalization_enabled boolean NOT NULL DEFAULT true,
  marketing_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_privacy_preferences TO authenticated;
GRANT ALL ON public.user_privacy_preferences TO service_role;
ALTER TABLE public.user_privacy_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage own privacy prefs" ON public.user_privacy_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_privacy_prefs_updated BEFORE UPDATE ON public.user_privacy_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','processing','completed','failed','expired')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  download_reference text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.data_export_requests TO authenticated;
GRANT ALL ON public.data_export_requests TO service_role;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own exports" ON public.data_export_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_ts_staff(auth.uid()));
CREATE POLICY "request own export" ON public.data_export_requests
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND status = 'requested'
    AND NOT EXISTS (SELECT 1 FROM public.data_export_requests d
      WHERE d.user_id = auth.uid() AND d.requested_at > now() - interval '24 hours'));
CREATE POLICY "staff manage exports" ON public.data_export_requests
  FOR ALL TO authenticated USING (public.is_ts_staff(auth.uid())) WITH CHECK (public.is_ts_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmation_required','scheduled','cancelled','blocked_pending_orders','processing','completed','failed')),
  reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.account_deletion_requests TO authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own deletion requests" ON public.account_deletion_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_ts_staff(auth.uid()));
CREATE POLICY "create own deletion request" ON public.account_deletion_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status IN ('requested','scheduled','blocked_pending_orders'));
CREATE POLICY "cancel own deletion request" ON public.account_deletion_requests
  FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status IN ('requested','scheduled'))
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');
CREATE POLICY "staff manage deletion requests" ON public.account_deletion_requests
  FOR ALL TO authenticated USING (public.is_ts_staff(auth.uid())) WITH CHECK (public.is_ts_staff(auth.uid()));

-- ============ audit log & incidents ============
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  reason text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.is_ts_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.admin_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.admin_audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.admin_audit_logs(target_type, target_id);

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text, p_target_type text, p_target_id text, p_reason text DEFAULT NULL,
  p_before jsonb DEFAULT NULL, p_after jsonb DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_ts_staff(auth.uid()) AND NOT public.has_staff_role(auth.uid(),'support_agent')
     AND NOT public.has_staff_role(auth.uid(),'professional_reviewer')
     AND NOT public.has_staff_role(auth.uid(),'legal_editor')
     AND NOT public.has_role(auth.uid(),'moderator'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  INSERT INTO public.admin_audit_logs (actor_id, action, target_type, target_id, reason, before_state, after_state, metadata)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_reason, p_before, p_after, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text,text,text,text,jsonb,jsonb,jsonb) TO authenticated;

CREATE TABLE IF NOT EXISTS public.security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  incident_type text NOT NULL,
  title text NOT NULL,
  description text,
  affected_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','mitigated','resolved','closed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.security_incidents TO authenticated;
GRANT ALL ON public.security_incidents TO service_role;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ts staff manage incidents" ON public.security_incidents
  FOR ALL TO authenticated USING (public.is_ts_staff(auth.uid())) WITH CHECK (public.is_ts_staff(auth.uid()));
CREATE TRIGGER trg_security_incidents_updated BEFORE UPDATE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ dispute enhancements ============
ALTER TABLE public.marketplace_disputes
  ADD COLUMN IF NOT EXISTS dispute_type text,
  ADD COLUMN IF NOT EXISTS requested_resolution text,
  ADD COLUMN IF NOT EXISTS amount_in_question numeric,
  ADD COLUMN IF NOT EXISTS evidence_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS response_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_statement text,
  ADD COLUMN IF NOT EXISTS seller_statement text,
  ADD COLUMN IF NOT EXISTS mediator_notes text,
  ADD COLUMN IF NOT EXISTS decision text,
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- ============ private storage policies ============
CREATE POLICY "ts private upload own folder" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id IN ('professional-verification','support-attachments','dispute-evidence','appeal-evidence')
    AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "ts private read own folder" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id IN ('professional-verification','support-attachments','dispute-evidence','appeal-evidence')
    AND ((storage.foldername(name))[1] = auth.uid()::text
      OR public.is_ts_staff(auth.uid())
      OR public.has_staff_role(auth.uid(),'support_agent')));
CREATE POLICY "ts private delete own folder" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id IN ('professional-verification','support-attachments','dispute-evidence','appeal-evidence')
    AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============ feature flags ============
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('trust_system_enabled', true, 'مؤشرات الثقة العامة'),
  ('identity_verification_enabled', false, 'التحقق الرسمي من الهوية (يتطلب مزوّد)'),
  ('professional_verification_enabled', true, 'التحقق المهني عبر مراجعة WekiCode'),
  ('seller_levels_enabled', true, 'مستويات المستقلين'),
  ('trust_score_enabled', true, 'مؤشر الثقة'),
  ('support_center_enabled', true, 'مركز المساعدة'),
  ('support_tickets_enabled', true, 'تذاكر الدعم'),
  ('legal_center_enabled', true, 'مركز السياسات'),
  ('account_mfa_enabled', false, 'المصادقة الثنائية'),
  ('data_export_enabled', true, 'تصدير البيانات'),
  ('account_deletion_enabled', true, 'طلب حذف الحساب'),
  ('appeals_enabled', true, 'التظلمات'),
  ('enhanced_disputes_enabled', true, 'تحسينات النزاعات')
ON CONFLICT (key) DO NOTHING;