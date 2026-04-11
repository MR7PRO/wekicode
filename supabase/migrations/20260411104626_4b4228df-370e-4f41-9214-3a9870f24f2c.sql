
CREATE OR REPLACE FUNCTION public.increment_article_views(article_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles SET views = views + 1 WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql SET search_path = public;
