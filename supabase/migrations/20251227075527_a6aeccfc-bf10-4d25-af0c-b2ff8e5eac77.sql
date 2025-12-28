-- Fix: Restrict profile reads to authenticated users only
-- This addresses the PUBLIC_DATA_EXPOSURE security issue

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);