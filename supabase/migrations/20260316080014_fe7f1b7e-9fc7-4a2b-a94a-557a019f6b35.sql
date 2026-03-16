
-- Weekly challenges definitions
CREATE TABLE public.weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL DEFAULT 'answers', -- answers, streak, courses, questions
  target_count integer NOT NULL DEFAULT 5,
  reward_points integer NOT NULL DEFAULT 50,
  reward_badge text, -- optional badge id to award
  icon text NOT NULL DEFAULT 'target',
  is_active boolean NOT NULL DEFAULT true,
  week_start date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  week_end date NOT NULL DEFAULT (date_trunc('week', CURRENT_DATE) + interval '6 days')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User progress on challenges
CREATE TABLE public.user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_progress integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  points_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- RLS for weekly_challenges (public read)
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weekly challenges are viewable by everyone" ON public.weekly_challenges FOR SELECT TO public USING (true);

-- RLS for user_challenge_progress
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own challenge progress" ON public.user_challenge_progress FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenge progress" ON public.user_challenge_progress FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenge progress" ON public.user_challenge_progress FOR UPDATE TO public USING (auth.uid() = user_id);

-- Function to complete a challenge and award points
CREATE OR REPLACE FUNCTION public.complete_challenge(p_challenge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge RECORD;
  v_progress RECORD;
  v_result jsonb;
BEGIN
  -- Get challenge info
  SELECT * INTO v_challenge FROM weekly_challenges WHERE id = p_challenge_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found');
  END IF;

  -- Get user progress
  SELECT * INTO v_progress FROM user_challenge_progress 
  WHERE user_id = auth.uid() AND challenge_id = p_challenge_id;
  
  IF NOT FOUND OR v_progress.current_progress < v_challenge.target_count THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not completed yet');
  END IF;

  IF v_progress.points_awarded THEN
    RETURN jsonb_build_object('success', false, 'error', 'Points already awarded');
  END IF;

  -- Set bypass flag
  PERFORM set_config('app.bypass_gamification_check', 'true', true);

  -- Award points
  UPDATE profiles SET points = COALESCE(points, 0) + v_challenge.reward_points, updated_at = now()
  WHERE user_id = auth.uid();

  -- Mark as awarded
  UPDATE user_challenge_progress SET points_awarded = true, is_completed = true, completed_at = now(), updated_at = now()
  WHERE user_id = auth.uid() AND challenge_id = p_challenge_id;

  -- Reset bypass
  PERFORM set_config('app.bypass_gamification_check', 'false', true);

  RETURN jsonb_build_object('success', true, 'points_awarded', v_challenge.reward_points);
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_user_challenge_progress_updated_at
  BEFORE UPDATE ON public.user_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
