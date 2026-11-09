REVOKE EXECUTE ON FUNCTION public.forum_add_points(uuid, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_service_views(p_service_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  UPDATE public.marketplace_services SET views_count = COALESCE(views_count,0) + 1
  WHERE id = p_service_id AND status = 'active' AND seller_id <> auth.uid();
END $$;
REVOKE EXECUTE ON FUNCTION public.increment_service_views(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_service_views(uuid) TO authenticated;

UPDATE public.article_votes SET vote_type = sign(vote_type) WHERE vote_type NOT IN (-1, 1);
ALTER TABLE public.article_votes ADD CONSTRAINT article_votes_vote_type_range CHECK (vote_type IN (-1, 1));

ALTER TABLE public.workspace_subscriptions ALTER COLUMN status SET DEFAULT 'pending';
CREATE OR REPLACE FUNCTION public.guard_subscription_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSE
    NEW.status := OLD.status; NEW.price := OLD.price; NEW.start_date := OLD.start_date; NEW.end_date := OLD.end_date; NEW.plan_name := OLD.plan_name;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_subscription_status ON public.workspace_subscriptions;
CREATE TRIGGER guard_subscription_status BEFORE INSERT OR UPDATE ON public.workspace_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.guard_subscription_status();

DROP POLICY IF EXISTS "roles readable" ON public.user_roles;
CREATE POLICY "users read own roles or admin" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND email IS NOT NULL AND length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');