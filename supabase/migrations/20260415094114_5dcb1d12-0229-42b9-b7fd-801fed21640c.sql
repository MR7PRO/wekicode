CREATE OR REPLACE FUNCTION public.prevent_gamification_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  -- Allow bypass from system triggers (checkin, quiz, article, etc.)
  IF current_setting('app.bypass_gamification_check', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Prevent direct changes to gamification fields (points, level, badges)
  IF (NEW.points IS DISTINCT FROM OLD.points) OR 
     (NEW.level IS DISTINCT FROM OLD.level) OR 
     (NEW.badges IS DISTINCT FROM OLD.badges) THEN
    RAISE EXCEPTION 'Cannot directly modify gamification fields (points, level, badges). These are managed automatically by the system.';
  END IF;
  RETURN NEW;
END;
$$;