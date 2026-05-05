CREATE OR REPLACE FUNCTION public.award_streak_badges()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_streak INTEGER;
  v_badges TEXT[];
  v_new_badges TEXT[] := '{}';
BEGIN
  SELECT current_streak, COALESCE(badges, '{}')
  INTO v_current_streak, v_badges
  FROM profiles
  WHERE user_id = NEW.user_id;

  IF v_current_streak >= 3 AND NOT ('streak_3' = ANY(v_badges)) THEN v_new_badges := array_append(v_new_badges, 'streak_3'); END IF;
  IF v_current_streak >= 7 AND NOT ('streak_7' = ANY(v_badges)) THEN v_new_badges := array_append(v_new_badges, 'streak_7'); END IF;
  IF v_current_streak >= 14 AND NOT ('streak_14' = ANY(v_badges)) THEN v_new_badges := array_append(v_new_badges, 'streak_14'); END IF;
  IF v_current_streak >= 30 AND NOT ('streak_30' = ANY(v_badges)) THEN v_new_badges := array_append(v_new_badges, 'streak_30'); END IF;
  IF v_current_streak >= 60 AND NOT ('streak_60' = ANY(v_badges)) THEN v_new_badges := array_append(v_new_badges, 'streak_60'); END IF;
  IF v_current_streak >= 90 AND NOT ('streak_90' = ANY(v_badges)) THEN v_new_badges := array_append(v_new_badges, 'streak_90'); END IF;
  IF v_current_streak >= 100 AND NOT ('streak_100' = ANY(v_badges)) THEN v_new_badges := array_append(v_new_badges, 'streak_100'); END IF;

  IF array_length(v_new_badges, 1) > 0 THEN
    PERFORM set_config('app.bypass_gamification_check', 'true', true);
    UPDATE profiles
      SET badges = v_badges || v_new_badges,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    PERFORM set_config('app.bypass_gamification_check', 'false', true);
  END IF;

  RETURN NEW;
END;
$function$;

-- Remove duplicate triggers
DROP TRIGGER IF EXISTS award_answer_points ON public.answers;
DROP TRIGGER IF EXISTS award_question_points ON public.questions;