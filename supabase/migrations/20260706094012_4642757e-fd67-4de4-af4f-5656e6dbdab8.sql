
-- Grant read access to public quiz questions view
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- Add image support to posts
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS image_url text;
