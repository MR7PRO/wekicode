
-- 1. INVOICES: Restrict insert to pending + unpaid + valid amount
DROP POLICY IF EXISTS "Users can create own invoices" ON public.invoices;
CREATE POLICY "Users can create own invoices"
ON public.invoices FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND paid_at IS NULL
  AND total_amount >= 0
);

-- 2. PROFILES: Attach trigger that blocks direct gamification field updates
DROP TRIGGER IF EXISTS prevent_profile_gamification_updates ON public.profiles;
CREATE TRIGGER prevent_profile_gamification_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_gamification_updates();

-- Extend the trigger function to also protect streak fields
CREATE OR REPLACE FUNCTION public.prevent_gamification_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.bypass_gamification_check', true) = 'true' THEN
    RETURN NEW;
  END IF;
  IF (NEW.points IS DISTINCT FROM OLD.points)
     OR (NEW.level IS DISTINCT FROM OLD.level)
     OR (NEW.badges IS DISTINCT FROM OLD.badges)
     OR (NEW.current_streak IS DISTINCT FROM OLD.current_streak)
     OR (NEW.longest_streak IS DISTINCT FROM OLD.longest_streak)
     OR (NEW.last_checkin_date IS DISTINCT FROM OLD.last_checkin_date) THEN
    RAISE EXCEPTION 'Cannot directly modify gamification fields. These are managed automatically by the system.';
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. USER_CHALLENGE_PROGRESS: Remove direct write policies; expose secure RPC
DROP POLICY IF EXISTS "Users can insert own challenge progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users can update own challenge progress" ON public.user_challenge_progress;

CREATE OR REPLACE FUNCTION public.refresh_challenge_progress(p_challenge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_challenge RECORD;
  v_progress integer := 0;
  v_week_start date;
  v_week_end_ts timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_challenge FROM weekly_challenges WHERE id = p_challenge_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found');
  END IF;

  v_week_start := v_challenge.week_start;
  v_week_end_ts := (v_challenge.week_end + 1)::timestamptz;

  IF v_challenge.challenge_type = 'answers' THEN
    SELECT COUNT(*) INTO v_progress FROM answers
      WHERE user_id = v_user_id AND created_at >= v_week_start AND created_at < v_week_end_ts;
  ELSIF v_challenge.challenge_type = 'questions' THEN
    SELECT COUNT(*) INTO v_progress FROM questions
      WHERE user_id = v_user_id AND created_at >= v_week_start AND created_at < v_week_end_ts;
  ELSIF v_challenge.challenge_type = 'courses' THEN
    SELECT COUNT(*) INTO v_progress FROM course_enrollments
      WHERE user_id = v_user_id AND created_at >= v_week_start AND created_at < v_week_end_ts;
  ELSIF v_challenge.challenge_type = 'streak' THEN
    SELECT COALESCE(current_streak, 0) INTO v_progress FROM profiles WHERE user_id = v_user_id;
  END IF;

  INSERT INTO user_challenge_progress (user_id, challenge_id, current_progress, is_completed)
  VALUES (v_user_id, p_challenge_id, v_progress, v_progress >= v_challenge.target_count)
  ON CONFLICT (user_id, challenge_id) DO UPDATE
  SET current_progress = EXCLUDED.current_progress,
      is_completed = (user_challenge_progress.points_awarded
                      OR EXCLUDED.current_progress >= v_challenge.target_count),
      updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'current_progress', v_progress,
    'is_completed', v_progress >= v_challenge.target_count
  );
END;
$$;

-- Ensure unique constraint exists for ON CONFLICT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_challenge_progress_user_challenge_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.user_challenge_progress
        ADD CONSTRAINT user_challenge_progress_user_challenge_unique UNIQUE (user_id, challenge_id);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- 4. REALTIME: Drop overly permissive policy on messages
DROP POLICY IF EXISTS "authenticated_can_use_realtime" ON public.messages;

-- 5. REALTIME schema policy: drop overly permissive policy if present
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', r.policyname);
  END LOOP;
END $$;
