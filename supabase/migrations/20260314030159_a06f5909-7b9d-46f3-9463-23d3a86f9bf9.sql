
-- Add new columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Update update_profile_info function to handle new fields
CREATE OR REPLACE FUNCTION public.update_profile_info(
  p_full_name text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_skills text[] DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_cover_url text DEFAULT NULL,
  p_github_url text DEFAULT NULL,
  p_linkedin_url text DEFAULT NULL,
  p_twitter_url text DEFAULT NULL,
  p_website_url text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_is_public boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET 
    full_name = COALESCE(p_full_name, full_name),
    bio = COALESCE(p_bio, bio),
    skills = COALESCE(p_skills, skills),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    cover_url = COALESCE(p_cover_url, cover_url),
    github_url = COALESCE(p_github_url, github_url),
    linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
    twitter_url = COALESCE(p_twitter_url, twitter_url),
    website_url = COALESCE(p_website_url, website_url),
    location = COALESCE(p_location, location),
    is_public = COALESCE(p_is_public, is_public),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- Create covers storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for covers bucket
CREATE POLICY "Users can upload their own cover" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own cover" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Covers are publicly viewable" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'covers');

CREATE POLICY "Users can delete their own cover" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public profile viewing (update RLS)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT TO public
  USING (true);
