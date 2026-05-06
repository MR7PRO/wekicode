
-- 1) daily_checkins: lock points_earned to 5 via policy + check constraint
DROP POLICY IF EXISTS "Users can insert their own check-ins" ON public.daily_checkins;
CREATE POLICY "Users can insert their own check-ins"
ON public.daily_checkins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND points_earned = 5);

ALTER TABLE public.daily_checkins
  DROP CONSTRAINT IF EXISTS daily_checkins_points_earned_check;
ALTER TABLE public.daily_checkins
  ADD CONSTRAINT daily_checkins_points_earned_check CHECK (points_earned BETWEEN 1 AND 10);

-- 2) quiz_attempts: revoke direct INSERT; only the SECURITY DEFINER RPC may insert
DROP POLICY IF EXISTS "Users can submit quiz attempts" ON public.quiz_attempts;
-- (No INSERT policy => clients cannot insert; submit_quiz_attempt RPC bypasses RLS as DEFINER)

-- 3) reward_redemptions: enforce points_spent equals the actual reward cost
DROP POLICY IF EXISTS "Users can redeem rewards" ON public.reward_redemptions;
CREATE POLICY "Users can redeem rewards"
ON public.reward_redemptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND points_spent = (
    SELECT points_cost FROM public.rewards
     WHERE id = reward_redemptions.reward_id AND is_active = true
  )
);

-- 4) ai_chat_rate_limits: remove user-facing write policies; only service role writes via RPC
DROP POLICY IF EXISTS "Users can insert own rate limits" ON public.ai_chat_rate_limits;
DROP POLICY IF EXISTS "Users can update own rate limits" ON public.ai_chat_rate_limits;
-- Keep SELECT policy so users can view their own quota
