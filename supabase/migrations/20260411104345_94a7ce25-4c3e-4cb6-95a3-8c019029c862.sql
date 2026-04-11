
-- Articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  views INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Articles are viewable by everyone" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Users can create articles" ON public.articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own articles" ON public.articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own articles" ON public.articles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Article comments
CREATE TABLE public.article_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article comments viewable by everyone" ON public.article_comments FOR SELECT USING (true);
CREATE POLICY "Users can create article comments" ON public.article_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own article comments" ON public.article_comments FOR DELETE USING (auth.uid() = user_id);

-- Article votes (reuse vote pattern)
CREATE TABLE public.article_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

ALTER TABLE public.article_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article votes viewable by everyone" ON public.article_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote on articles" ON public.article_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change article vote" ON public.article_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove article vote" ON public.article_votes FOR DELETE USING (auth.uid() = user_id);

-- Update article votes count trigger
CREATE OR REPLACE FUNCTION public.update_article_votes()
RETURNS TRIGGER AS $$
DECLARE
  v_article_id UUID;
  v_new_total INTEGER;
BEGIN
  v_article_id := COALESCE(NEW.article_id, OLD.article_id);
  SELECT COALESCE(SUM(vote_type), 0) INTO v_new_total FROM article_votes WHERE article_id = v_article_id;
  UPDATE articles SET votes = v_new_total WHERE id = v_article_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_article_vote_change AFTER INSERT OR UPDATE OR DELETE ON public.article_votes FOR EACH ROW EXECUTE FUNCTION public.update_article_votes();

-- Increment article comments count
CREATE OR REPLACE FUNCTION public.increment_article_comments(article_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles SET comments_count = comments_count + 1 WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Award points for article
CREATE OR REPLACE FUNCTION public.award_points_for_article()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('app.bypass_gamification_check', 'true', true);
  UPDATE profiles SET points = COALESCE(points, 0) + 15, updated_at = now() WHERE user_id = NEW.user_id;
  PERFORM set_config('app.bypass_gamification_check', 'false', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_article_created AFTER INSERT ON public.articles FOR EACH ROW EXECUTE FUNCTION public.award_points_for_article();

-- Follows table
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Enable realtime for articles
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
