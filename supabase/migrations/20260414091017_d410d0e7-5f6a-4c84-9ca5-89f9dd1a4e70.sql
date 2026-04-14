
-- Create a temporary function to bypass the gamification trigger
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_user_id uuid,
  p_bio text DEFAULT NULL,
  p_skills text[] DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_level integer DEFAULT NULL,
  p_points integer DEFAULT NULL,
  p_current_streak integer DEFAULT NULL,
  p_longest_streak integer DEFAULT NULL,
  p_github_url text DEFAULT NULL,
  p_linkedin_url text DEFAULT NULL,
  p_twitter_url text DEFAULT NULL,
  p_badges text[] DEFAULT NULL,
  p_is_public boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Temporarily disable the trigger by setting a session variable
  PERFORM set_config('app.bypass_gamification_check', 'true', true);
  
  UPDATE profiles SET
    bio = COALESCE(p_bio, bio),
    skills = COALESCE(p_skills, skills),
    location = COALESCE(p_location, location),
    level = COALESCE(p_level, level),
    points = COALESCE(p_points, points),
    current_streak = COALESCE(p_current_streak, current_streak),
    longest_streak = COALESCE(p_longest_streak, longest_streak),
    github_url = COALESCE(p_github_url, github_url),
    linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
    twitter_url = COALESCE(p_twitter_url, twitter_url),
    badges = COALESCE(p_badges, badges),
    is_public = COALESCE(p_is_public, is_public),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  PERFORM set_config('app.bypass_gamification_check', 'false', true);
END;
$$;
