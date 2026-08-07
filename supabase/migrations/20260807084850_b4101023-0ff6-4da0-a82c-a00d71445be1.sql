-- forum_topics
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_desc ON public.forum_topics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_forum_status ON public.forum_topics (forum_id, status);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author_created ON public.forum_topics (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_pinned ON public.forum_topics (forum_id, is_pinned) WHERE is_pinned;
CREATE INDEX IF NOT EXISTS idx_forum_topics_featured ON public.forum_topics (last_activity_at DESC) WHERE is_featured;
CREATE INDEX IF NOT EXISTS idx_forum_topics_type ON public.forum_topics (type);

-- forum_replies
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic_created ON public.forum_replies (topic_id, created_at);

-- forum_topic_tags / forum_tags
CREATE INDEX IF NOT EXISTS idx_forum_topic_tags_tag ON public.forum_topic_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_forum_tags_usage ON public.forum_tags (usage_count DESC);

-- forum_bookmarks
CREATE INDEX IF NOT EXISTS idx_forum_bookmarks_topic ON public.forum_bookmarks (topic_id);

-- forum_reports
CREATE INDEX IF NOT EXISTS idx_forum_reports_reporter ON public.forum_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_forum_reports_topic ON public.forum_reports (topic_id) WHERE topic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_reports_reply ON public.forum_reports (reply_id) WHERE reply_id IS NOT NULL;

-- knowledge_articles
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_created ON public.knowledge_articles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_status_updated ON public.knowledge_articles (status, updated_at DESC);

-- ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_action_created ON public.ai_usage_logs (user_id, action, created_at DESC);

-- data integrity: a report must target exactly one of topic/reply
ALTER TABLE public.forum_reports
  ADD CONSTRAINT forum_reports_target_check
  CHECK ((topic_id IS NOT NULL) <> (reply_id IS NOT NULL)) NOT VALID;