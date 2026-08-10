-- ============ 1. PROFILE UPGRADE ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hourly_rate_min numeric,
  ADD COLUMN IF NOT EXISTS hourly_rate_max numeric,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS freelancer_role text,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS marketplace_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketplace_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completion_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marketplace_rating_avg numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marketplace_rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_orders_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_time_hours integer;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_marketplace_idx ON public.profiles (marketplace_enabled, marketplace_rating_avg DESC) WHERE marketplace_enabled;

-- Prevent users from self-verifying or faking marketplace aggregates
CREATE OR REPLACE FUNCTION public.prevent_marketplace_profile_escalation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('app.bypass_marketplace_check', true) = 'true' THEN RETURN NEW; END IF;
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.marketplace_verified := OLD.marketplace_verified;
  NEW.marketplace_rating_avg := OLD.marketplace_rating_avg;
  NEW.marketplace_rating_count := OLD.marketplace_rating_count;
  NEW.completed_orders_count := OLD.completed_orders_count;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_prevent_marketplace_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_marketplace_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_marketplace_profile_escalation();

-- ============ 2. CATEGORIES ============
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_categories TO anon, authenticated;
GRANT ALL ON public.marketplace_categories TO service_role;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.marketplace_categories FOR SELECT USING (is_active OR public.is_forum_mod(auth.uid()));
CREATE POLICY "categories_admin_write" ON public.marketplace_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.marketplace_categories (slug, title, icon, display_order) VALUES
  ('web-development','تطوير مواقع','Globe',1),
  ('react-frontend','React / Frontend','Code2',2),
  ('backend-apis','Backend / APIs','Server',3),
  ('supabase-firebase','Supabase / Firebase','Database',4),
  ('wordpress-cms','WordPress / CMS','Layout',5),
  ('automation-ai','Automation / AI Tools','Bot',6),
  ('data-analysis','Data Analysis','BarChart3',7),
  ('ui-implementation','UI Implementation','Palette',8),
  ('bug-fixing','Bug Fixing','Bug',9),
  ('portfolio-landing','Portfolio / Landing Page','Rocket',10),
  ('technical-consultation','Technical Consultation','MessageSquare',11),
  ('proposal-writing','Freelance Proposal Writing','FileText',12)
ON CONFLICT (slug) DO NOTHING;

-- ============ 3. SERVICES ============
CREATE TABLE IF NOT EXISTS public.marketplace_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  slug text UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  short_description text,
  status text NOT NULL DEFAULT 'draft',
  base_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  delivery_days integer NOT NULL DEFAULT 3,
  revisions_included integer NOT NULL DEFAULT 1,
  cover_image_url text,
  gallery_urls text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  requirements text,
  rating_avg numeric NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  orders_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  admin_locked boolean NOT NULL DEFAULT false,
  moderation_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT services_status_chk CHECK (status IN ('draft','pending_review','active','paused','rejected','archived')),
  CONSTRAINT services_price_chk CHECK (base_price >= 0),
  CONSTRAINT services_delivery_chk CHECK (delivery_days >= 1)
);
GRANT SELECT ON public.marketplace_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_services TO authenticated;
GRANT ALL ON public.marketplace_services TO service_role;
ALTER TABLE public.marketplace_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_public_read_active" ON public.marketplace_services FOR SELECT USING (status = 'active');
CREATE POLICY "services_owner_read" ON public.marketplace_services FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "services_mod_read" ON public.marketplace_services FOR SELECT TO authenticated USING (public.is_forum_mod(auth.uid()));
CREATE POLICY "services_owner_insert" ON public.marketplace_services FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "services_owner_update" ON public.marketplace_services FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() AND NOT admin_locked) WITH CHECK (seller_id = auth.uid());
CREATE POLICY "services_owner_delete" ON public.marketplace_services FOR DELETE TO authenticated
  USING (seller_id = auth.uid() AND status IN ('draft','rejected','archived'));
CREATE POLICY "services_mod_update" ON public.marketplace_services FOR UPDATE TO authenticated
  USING (public.is_forum_mod(auth.uid())) WITH CHECK (public.is_forum_mod(auth.uid()));

CREATE INDEX IF NOT EXISTS services_seller_idx ON public.marketplace_services (seller_id, status);
CREATE INDEX IF NOT EXISTS services_category_idx ON public.marketplace_services (category_id, status);
CREATE INDEX IF NOT EXISTS services_active_rating_idx ON public.marketplace_services (rating_avg DESC, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS services_tags_idx ON public.marketplace_services USING gin (tags);

-- Sellers cannot fake featured/ratings/counters
CREATE OR REPLACE FUNCTION public.guard_service_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('app.bypass_marketplace_check', true) = 'true' THEN RETURN NEW; END IF;
  IF auth.uid() IS NOT NULL AND public.is_forum_mod(auth.uid()) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_featured := false; NEW.admin_locked := false;
    NEW.rating_avg := 0; NEW.rating_count := 0; NEW.orders_count := 0; NEW.views_count := 0;
    IF NEW.status NOT IN ('draft','pending_review') THEN NEW.status := 'pending_review'; END IF;
  ELSE
    NEW.is_featured := OLD.is_featured; NEW.admin_locked := OLD.admin_locked;
    NEW.rating_avg := OLD.rating_avg; NEW.rating_count := OLD.rating_count;
    NEW.orders_count := OLD.orders_count; NEW.views_count := OLD.views_count;
    NEW.moderation_note := OLD.moderation_note;
    IF NEW.status <> OLD.status THEN
      IF NEW.status NOT IN ('draft','pending_review','paused','archived')
         OR (OLD.status IN ('active','paused') AND NEW.status = 'active') THEN
        NEW.status := OLD.status;
      END IF;
      IF OLD.status = 'paused' AND NEW.status = 'draft' THEN NEW.status := 'paused'; END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_guard_service_fields BEFORE INSERT OR UPDATE ON public.marketplace_services
FOR EACH ROW EXECUTE FUNCTION public.guard_service_fields();
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.marketplace_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_service_views(p_service_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('app.bypass_marketplace_check','true', true);
  UPDATE public.marketplace_services SET views_count = views_count + 1 WHERE id = p_service_id AND status = 'active';
  PERFORM set_config('app.bypass_marketplace_check','false', true);
END; $$;

-- ============ 4. SERVICE PACKAGES ============
CREATE TABLE IF NOT EXISTS public.marketplace_service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.marketplace_services(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'USD',
  delivery_days integer NOT NULL DEFAULT 3 CHECK (delivery_days >= 1),
  revisions integer NOT NULL DEFAULT 1,
  features text[] NOT NULL DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_service_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_service_packages TO authenticated;
GRANT ALL ON public.marketplace_service_packages TO service_role;
ALTER TABLE public.marketplace_service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_public_read" ON public.marketplace_service_packages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.marketplace_services s WHERE s.id = service_id AND s.status = 'active'));
CREATE POLICY "packages_owner_all" ON public.marketplace_service_packages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.marketplace_services s WHERE s.id = service_id AND s.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.marketplace_services s WHERE s.id = service_id AND s.seller_id = auth.uid()));
CREATE POLICY "packages_mod_read" ON public.marketplace_service_packages FOR SELECT TO authenticated
  USING (public.is_forum_mod(auth.uid()));
CREATE INDEX IF NOT EXISTS packages_service_idx ON public.marketplace_service_packages (service_id, display_order);

-- ============ 5. PROJECT REQUESTS ============
CREATE TABLE IF NOT EXISTS public.project_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) >= 10),
  description text NOT NULL CHECK (char_length(description) >= 50),
  budget_min numeric,
  budget_max numeric,
  currency text NOT NULL DEFAULT 'USD',
  deadline date,
  expected_duration text,
  skills_required text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open',
  visibility text NOT NULL DEFAULT 'public',
  attachments text[] NOT NULL DEFAULT '{}',
  proposals_count integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_status_chk CHECK (status IN ('draft','open','reviewing','assigned','in_progress','completed','cancelled','closed')),
  CONSTRAINT project_visibility_chk CHECK (visibility IN ('public','private'))
);
GRANT SELECT ON public.project_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_requests TO authenticated;
GRANT ALL ON public.project_requests TO service_role;
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_public_read" ON public.project_requests FOR SELECT
  USING (visibility = 'public' AND NOT is_hidden AND status IN ('open','reviewing','assigned','in_progress','completed'));
CREATE POLICY "projects_owner_read" ON public.project_requests FOR SELECT TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "projects_mod_read" ON public.project_requests FOR SELECT TO authenticated USING (public.is_forum_mod(auth.uid()));
CREATE POLICY "projects_owner_insert" ON public.project_requests FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "projects_owner_update" ON public.project_requests FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() AND NOT is_hidden) WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "projects_owner_delete" ON public.project_requests FOR DELETE TO authenticated
  USING (buyer_id = auth.uid() AND proposals_count = 0);
CREATE POLICY "projects_mod_update" ON public.project_requests FOR UPDATE TO authenticated
  USING (public.is_forum_mod(auth.uid())) WITH CHECK (public.is_forum_mod(auth.uid()));
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.project_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_category_idx ON public.project_requests (category_id, status);
CREATE INDEX IF NOT EXISTS projects_buyer_idx ON public.project_requests (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_skills_idx ON public.project_requests USING gin (skills_required);

CREATE OR REPLACE FUNCTION public.guard_project_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('app.bypass_marketplace_check', true) = 'true' THEN RETURN NEW; END IF;
  IF auth.uid() IS NOT NULL AND public.is_forum_mod(auth.uid()) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.proposals_count := 0; NEW.is_hidden := false;
  ELSE
    NEW.proposals_count := OLD.proposals_count; NEW.is_hidden := OLD.is_hidden;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_guard_project_fields BEFORE INSERT OR UPDATE ON public.project_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_project_fields();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.project_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 6. PROPOSALS ============
CREATE TABLE IF NOT EXISTS public.project_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  freelancer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter text NOT NULL CHECK (char_length(cover_letter) >= 40),
  proposed_price numeric,
  currency text NOT NULL DEFAULT 'USD',
  estimated_delivery_days integer,
  status text NOT NULL DEFAULT 'submitted',
  attachments text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_status_chk CHECK (status IN ('submitted','shortlisted','accepted','rejected','withdrawn')),
  CONSTRAINT proposals_unique UNIQUE (project_id, freelancer_id)
);
GRANT SELECT, INSERT, UPDATE ON public.project_proposals TO authenticated;
GRANT ALL ON public.project_proposals TO service_role;
ALTER TABLE public.project_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_own_read" ON public.project_proposals FOR SELECT TO authenticated USING (freelancer_id = auth.uid());
CREATE POLICY "proposals_buyer_read" ON public.project_proposals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.project_requests p WHERE p.id = project_id AND p.buyer_id = auth.uid()));
CREATE POLICY "proposals_admin_read" ON public.project_proposals FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "proposals_insert" ON public.project_proposals FOR INSERT TO authenticated
  WITH CHECK (freelancer_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.project_requests p
      WHERE p.id = project_id AND p.status = 'open' AND NOT p.is_hidden AND p.buyer_id <> auth.uid()));
CREATE POLICY "proposals_own_update" ON public.project_proposals FOR UPDATE TO authenticated
  USING (freelancer_id = auth.uid() AND status IN ('submitted','shortlisted'))
  WITH CHECK (freelancer_id = auth.uid());
CREATE POLICY "proposals_buyer_update" ON public.project_proposals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.project_requests p WHERE p.id = project_id AND p.buyer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.project_requests p WHERE p.id = project_id AND p.buyer_id = auth.uid()));
CREATE INDEX IF NOT EXISTS proposals_project_idx ON public.project_proposals (project_id, status);
CREATE INDEX IF NOT EXISTS proposals_freelancer_idx ON public.project_proposals (freelancer_id, created_at DESC);
CREATE TRIGGER trg_proposals_updated BEFORE UPDATE ON public.project_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.on_proposal_count_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title text; v_buyer uuid; v_name text;
BEGIN
  PERFORM set_config('app.bypass_marketplace_check','true', true);
  IF TG_OP = 'INSERT' THEN
    UPDATE public.project_requests SET proposals_count = proposals_count + 1 WHERE id = NEW.project_id
      RETURNING title, buyer_id INTO v_title, v_buyer;
    SELECT COALESCE(full_name,'مستقل') INTO v_name FROM public.profiles WHERE user_id = NEW.freelancer_id;
    PERFORM public.create_notification(v_buyer, NEW.freelancer_id, 'proposal_received',
      'عرض جديد على مشروعك', v_name || ' قدّم عرضًا على: ' || COALESCE(v_title,''), '/projects/' || NEW.project_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.project_requests SET proposals_count = GREATEST(proposals_count - 1, 0) WHERE id = OLD.project_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected','shortlisted') THEN
    SELECT title INTO v_title FROM public.project_requests WHERE id = NEW.project_id;
    PERFORM public.create_notification(NEW.freelancer_id, auth.uid(), 'proposal_' || NEW.status,
      CASE NEW.status WHEN 'accepted' THEN 'تم قبول عرضك 🎉' WHEN 'rejected' THEN 'لم يتم قبول عرضك' ELSE 'تم ترشيح عرضك' END,
      COALESCE(v_title,''), '/marketplace/my-proposals');
  END IF;
  PERFORM set_config('app.bypass_marketplace_check','false', true);
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_proposal_count AFTER INSERT OR UPDATE OR DELETE ON public.project_proposals
FOR EACH ROW EXECUTE FUNCTION public.on_proposal_count_change();

-- ============ 7. ORDERS ============
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  service_id uuid REFERENCES public.marketplace_services(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.marketplace_service_packages(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.project_requests(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES public.project_proposals(id) ON DELETE SET NULL,
  title text NOT NULL,
  scope text NOT NULL,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'USD',
  platform_fee numeric NOT NULL DEFAULT 0,
  seller_amount numeric NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'none',
  status text NOT NULL DEFAULT 'pending',
  delivery_due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_status_chk CHECK (status IN ('pending','accepted','in_progress','submitted','revision_requested','completed','cancelled','disputed')),
  CONSTRAINT order_self_chk CHECK (buyer_id <> seller_id)
);
GRANT SELECT, INSERT, UPDATE ON public.marketplace_orders TO authenticated;
GRANT ALL ON public.marketplace_orders TO service_role;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_participant_read" ON public.marketplace_orders FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders_buyer_insert" ON public.marketplace_orders FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() AND seller_id <> auth.uid());
CREATE POLICY "orders_participant_update" ON public.marketplace_orders FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS orders_buyer_idx ON public.marketplace_orders (buyer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_seller_idx ON public.marketplace_orders (seller_id, status, created_at DESC);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.marketplace_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.guard_order_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pct numeric := 0; v_fixed numeric := 0;
BEGIN
  IF current_setting('app.bypass_marketplace_check', true) = 'true' THEN RETURN NEW; END IF;
  SELECT percentage, fixed_fee INTO v_pct, v_fixed FROM public.platform_fee_rules
   WHERE is_active ORDER BY created_at DESC LIMIT 1;
  IF TG_OP = 'INSERT' THEN
    NEW.platform_fee := ROUND(COALESCE(NEW.price,0) * COALESCE(v_pct,0) / 100.0 + COALESCE(v_fixed,0), 2);
    NEW.seller_amount := GREATEST(COALESCE(NEW.price,0) - NEW.platform_fee, 0);
    NEW.status := 'pending'; NEW.completed_at := NULL;
  ELSE
    NEW.platform_fee := OLD.platform_fee; NEW.seller_amount := OLD.seller_amount;
    NEW.price := OLD.price; NEW.buyer_id := OLD.buyer_id; NEW.seller_id := OLD.seller_id;
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN NEW.completed_at := now(); END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.on_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_other uuid; v_msg text;
BEGIN
  PERFORM set_config('app.bypass_marketplace_check','true', true);
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(NEW.seller_id, NEW.buyer_id, 'order_created',
      'طلب جديد 📦', NEW.title, '/orders/' || NEW.id);
    IF NEW.service_id IS NOT NULL THEN
      UPDATE public.marketplace_services SET orders_count = orders_count + 1 WHERE id = NEW.service_id;
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    v_other := CASE WHEN auth.uid() = NEW.buyer_id THEN NEW.seller_id ELSE NEW.buyer_id END;
    v_msg := CASE NEW.status
      WHEN 'accepted' THEN 'تم قبول الطلب'
      WHEN 'in_progress' THEN 'العمل جارٍ على الطلب'
      WHEN 'submitted' THEN 'تم تسليم العمل'
      WHEN 'revision_requested' THEN 'تم طلب تعديل'
      WHEN 'completed' THEN 'اكتمل الطلب ✅'
      WHEN 'cancelled' THEN 'تم إلغاء الطلب'
      WHEN 'disputed' THEN 'تم فتح نزاع على الطلب'
      ELSE 'تحديث على الطلب' END;
    PERFORM public.create_notification(v_other, auth.uid(), 'order_' || NEW.status, v_msg, NEW.title, '/orders/' || NEW.id);
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
      UPDATE public.profiles SET completed_orders_count = completed_orders_count + 1
        WHERE user_id IN (NEW.seller_id);
    END IF;
  END IF;
  PERFORM set_config('app.bypass_marketplace_check','false', true);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_guard_order_fields BEFORE INSERT OR UPDATE ON public.marketplace_orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_fields();
CREATE TRIGGER trg_order_status AFTER INSERT OR UPDATE ON public.marketplace_orders
FOR EACH ROW EXECUTE FUNCTION public.on_order_status_change();

CREATE OR REPLACE FUNCTION public.is_order_participant(_order_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.marketplace_orders o
    WHERE o.id = _order_id AND (o.buyer_id = _uid OR o.seller_id = _uid));
$$;

-- ============ 8. ORDER MESSAGES + DELIVERABLES ============
CREATE TABLE IF NOT EXISTS public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  attachments text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_messages TO authenticated;
GRANT ALL ON public.order_messages TO service_role;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_messages_read" ON public.order_messages FOR SELECT TO authenticated
  USING (public.is_order_participant(order_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "order_messages_insert" ON public.order_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_order_participant(order_id, auth.uid()));
CREATE INDEX IF NOT EXISTS order_messages_idx ON public.order_messages (order_id, created_at);

CREATE TABLE IF NOT EXISTS public.order_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  files text[] NOT NULL DEFAULT '{}',
  links text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_deliverables TO authenticated;
GRANT ALL ON public.order_deliverables TO service_role;
ALTER TABLE public.order_deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliverables_read" ON public.order_deliverables FOR SELECT TO authenticated
  USING (public.is_order_participant(order_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "deliverables_insert" ON public.order_deliverables FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.marketplace_orders o WHERE o.id = order_id AND o.seller_id = auth.uid()));
CREATE INDEX IF NOT EXISTS deliverables_order_idx ON public.order_deliverables (order_id, created_at DESC);

-- ============ 9. PAYMENTS ============
CREATE TABLE IF NOT EXISTS public.platform_fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  fixed_fee numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_fee_rules TO anon, authenticated;
GRANT ALL ON public.platform_fee_rules TO service_role;
ALTER TABLE public.platform_fee_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fee_rules_read" ON public.platform_fee_rules FOR SELECT USING (is_active);
CREATE POLICY "fee_rules_admin" ON public.platform_fee_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.platform_fee_rules (name, percentage, fixed_fee)
SELECT 'العمولة الافتراضية', 10, 0
WHERE NOT EXISTS (SELECT 1 FROM public.platform_fee_rules);

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_payment_id text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  platform_fee numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'created',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_provider_chk CHECK (provider IN ('stripe','paypal','manual','none')),
  CONSTRAINT payment_status_chk CHECK (status IN ('created','pending','paid','failed','cancelled','refunded'))
);
GRANT SELECT ON public.payment_intents TO authenticated;
GRANT ALL ON public.payment_intents TO service_role;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
-- Read-only for participants; writes happen server-side only (service_role).
CREATE POLICY "payments_participant_read" ON public.payment_intents FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS payments_order_idx ON public.payment_intents (order_id);
CREATE INDEX IF NOT EXISTS payments_provider_status_idx ON public.payment_intents (provider, status);
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payment_intents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.seller_payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_id text,
  status text NOT NULL DEFAULT 'not_connected',
  country text,
  currency text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payout_status_chk CHECK (status IN ('not_connected','pending','active','restricted','disabled')),
  CONSTRAINT payout_unique UNIQUE (user_id, provider)
);
GRANT SELECT ON public.seller_payout_accounts TO authenticated;
GRANT ALL ON public.seller_payout_accounts TO service_role;
ALTER TABLE public.seller_payout_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout_owner_read" ON public.seller_payout_accounts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_payout_updated BEFORE UPDATE ON public.seller_payout_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 10. REVIEWS ============
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.marketplace_services(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  communication_rating integer CHECK (communication_rating BETWEEN 1 AND 5),
  quality_rating integer CHECK (quality_rating BETWEEN 1 AND 5),
  delivery_rating integer CHECK (delivery_rating BETWEEN 1 AND 5),
  comment text,
  is_public boolean NOT NULL DEFAULT true,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_self_chk CHECK (reviewer_id <> reviewee_id),
  CONSTRAINT review_unique UNIQUE (order_id, reviewer_id)
);
GRANT SELECT ON public.marketplace_reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON public.marketplace_reviews TO authenticated;
GRANT ALL ON public.marketplace_reviews TO service_role;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON public.marketplace_reviews FOR SELECT USING (is_public AND NOT is_hidden);
CREATE POLICY "reviews_participant_read" ON public.marketplace_reviews FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid() OR public.is_forum_mod(auth.uid()));
CREATE POLICY "reviews_insert" ON public.marketplace_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.marketplace_orders o WHERE o.id = order_id AND o.status = 'completed'
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
      AND reviewee_id = CASE WHEN o.buyer_id = auth.uid() THEN o.seller_id ELSE o.buyer_id END));
CREATE POLICY "reviews_own_update" ON public.marketplace_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid() AND created_at > now() - interval '7 days' AND NOT is_hidden)
  WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "reviews_mod_update" ON public.marketplace_reviews FOR UPDATE TO authenticated
  USING (public.is_forum_mod(auth.uid())) WITH CHECK (public.is_forum_mod(auth.uid()));
CREATE INDEX IF NOT EXISTS reviews_service_idx ON public.marketplace_reviews (service_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_reviewee_idx ON public.marketplace_reviews (reviewee_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.recompute_marketplace_ratings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_service uuid := COALESCE(NEW.service_id, OLD.service_id);
        v_user uuid := COALESCE(NEW.reviewee_id, OLD.reviewee_id);
        v_avg numeric; v_cnt integer;
BEGIN
  PERFORM set_config('app.bypass_marketplace_check','true', true);
  IF v_service IS NOT NULL THEN
    SELECT ROUND(AVG(rating)::numeric, 2), COUNT(*) INTO v_avg, v_cnt
      FROM public.marketplace_reviews WHERE service_id = v_service AND is_public AND NOT is_hidden;
    UPDATE public.marketplace_services SET rating_avg = COALESCE(v_avg,0), rating_count = COALESCE(v_cnt,0)
      WHERE id = v_service;
  END IF;
  IF v_user IS NOT NULL THEN
    SELECT ROUND(AVG(rating)::numeric, 2), COUNT(*) INTO v_avg, v_cnt
      FROM public.marketplace_reviews WHERE reviewee_id = v_user AND is_public AND NOT is_hidden;
    UPDATE public.profiles SET marketplace_rating_avg = COALESCE(v_avg,0), marketplace_rating_count = COALESCE(v_cnt,0)
      WHERE user_id = v_user;
    PERFORM public.create_notification(v_user, COALESCE(NEW.reviewer_id, OLD.reviewer_id), 'review_received',
      'تقييم جديد ⭐', 'حصلت على تقييم جديد على عملك', '/u/' || v_user);
  END IF;
  PERFORM set_config('app.bypass_marketplace_check','false', true);
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_recompute_ratings AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_marketplace_ratings();

-- ============ 11. DISPUTES ============
CREATE TABLE IF NOT EXISTS public.marketplace_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  attachments text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open',
  resolution text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dispute_status_chk CHECK (status IN ('open','under_review','resolved','rejected','closed'))
);
GRANT SELECT, INSERT, UPDATE ON public.marketplace_disputes TO authenticated;
GRANT ALL ON public.marketplace_disputes TO service_role;
ALTER TABLE public.marketplace_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_participant_read" ON public.marketplace_disputes FOR SELECT TO authenticated
  USING (public.is_order_participant(order_id, auth.uid()) OR public.is_forum_mod(auth.uid()));
CREATE POLICY "disputes_insert" ON public.marketplace_disputes FOR INSERT TO authenticated
  WITH CHECK (opened_by = auth.uid() AND public.is_order_participant(order_id, auth.uid()));
CREATE POLICY "disputes_mod_update" ON public.marketplace_disputes FOR UPDATE TO authenticated
  USING (public.is_forum_mod(auth.uid())) WITH CHECK (public.is_forum_mod(auth.uid()));
CREATE INDEX IF NOT EXISTS disputes_status_idx ON public.marketplace_disputes (status, created_at DESC);

-- ============ 12. MARKETPLACE REPORTS ============
CREATE TABLE IF NOT EXISTS public.marketplace_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mreport_target_chk CHECK (target_type IN ('service','project','profile','order','review')),
  CONSTRAINT mreport_status_chk CHECK (status IN ('pending','reviewed','dismissed','actioned'))
);
GRANT SELECT, INSERT, UPDATE ON public.marketplace_reports TO authenticated;
GRANT ALL ON public.marketplace_reports TO service_role;
ALTER TABLE public.marketplace_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mreports_own_read" ON public.marketplace_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_forum_mod(auth.uid()));
CREATE POLICY "mreports_insert" ON public.marketplace_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "mreports_mod_update" ON public.marketplace_reports FOR UPDATE TO authenticated
  USING (public.is_forum_mod(auth.uid())) WITH CHECK (public.is_forum_mod(auth.uid()));
CREATE INDEX IF NOT EXISTS mreports_status_idx ON public.marketplace_reports (status, target_type, created_at DESC);

-- ============ 13. FEATURE FLAGS ============
INSERT INTO public.feature_flags (key, enabled, description, audience) VALUES
  ('marketplace_enabled', true, 'سوق WekiCode', 'all'),
  ('services_enabled', true, 'إنشاء وعرض الخدمات', 'all'),
  ('project_requests_enabled', true, 'طلبات المشاريع', 'all'),
  ('proposals_enabled', true, 'العروض على المشاريع', 'all'),
  ('orders_enabled', true, 'الطلبات والاتفاقيات', 'all'),
  ('reviews_enabled', true, 'التقييمات', 'all'),
  ('payments_enabled', false, 'الدفع الإلكتروني', 'all'),
  ('provider_stripe_enabled', false, 'مزود Stripe', 'all'),
  ('provider_paypal_enabled', false, 'مزود PayPal', 'all'),
  ('manual_payment_enabled', true, 'الاتفاق اليدوي خارج المنصة', 'all')
ON CONFLICT (key) DO NOTHING;