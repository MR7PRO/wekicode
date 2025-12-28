-- Create function to award streak badges
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
  -- Get current streak and badges
  SELECT current_streak, COALESCE(badges, '{}')
  INTO v_current_streak, v_badges
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Check for streak badges to award
  IF v_current_streak >= 3 AND NOT ('streak_3' = ANY(v_badges)) THEN
    v_new_badges := array_append(v_new_badges, 'streak_3');
  END IF;
  
  IF v_current_streak >= 7 AND NOT ('streak_7' = ANY(v_badges)) THEN
    v_new_badges := array_append(v_new_badges, 'streak_7');
  END IF;
  
  IF v_current_streak >= 14 AND NOT ('streak_14' = ANY(v_badges)) THEN
    v_new_badges := array_append(v_new_badges, 'streak_14');
  END IF;
  
  IF v_current_streak >= 30 AND NOT ('streak_30' = ANY(v_badges)) THEN
    v_new_badges := array_append(v_new_badges, 'streak_30');
  END IF;
  
  IF v_current_streak >= 60 AND NOT ('streak_60' = ANY(v_badges)) THEN
    v_new_badges := array_append(v_new_badges, 'streak_60');
  END IF;
  
  IF v_current_streak >= 90 AND NOT ('streak_90' = ANY(v_badges)) THEN
    v_new_badges := array_append(v_new_badges, 'streak_90');
  END IF;
  
  IF v_current_streak >= 100 AND NOT ('streak_100' = ANY(v_badges)) THEN
    v_new_badges := array_append(v_new_badges, 'streak_100');
  END IF;
  
  -- Update badges if there are new ones
  IF array_length(v_new_badges, 1) > 0 THEN
    UPDATE profiles
    SET badges = v_badges || v_new_badges,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for awarding streak badges after checkin
DROP TRIGGER IF EXISTS award_streak_badges_trigger ON daily_checkins;
CREATE TRIGGER award_streak_badges_trigger
  AFTER INSERT ON daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.award_streak_badges();