CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  device_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own push subs select" ON public.push_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own push subs insert" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own push subs update" ON public.push_subscriptions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own push subs delete" ON public.push_subscriptions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id) WHERE is_active;
CREATE TRIGGER trg_push_subscriptions_updated BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  replies_enabled boolean NOT NULL DEFAULT true,
  mentions_enabled boolean NOT NULL DEFAULT true,
  solutions_enabled boolean NOT NULL DEFAULT true,
  achievements_enabled boolean NOT NULL DEFAULT true,
  followed_content_enabled boolean NOT NULL DEFAULT false,
  weekly_digest_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif prefs select" ON public.notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notif prefs insert" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notif prefs update" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_notification_preferences_updated BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.offline_saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz,
  UNIQUE (user_id, item_type, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offline_saved_items TO authenticated;
GRANT ALL ON public.offline_saved_items TO service_role;
ALTER TABLE public.offline_saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own offline items select" ON public.offline_saved_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own offline items insert" ON public.offline_saved_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own offline items update" ON public.offline_saved_items FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own offline items delete" ON public.offline_saved_items FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_offline_saved_items_user ON public.offline_saved_items(user_id, saved_at DESC);