# WekiCode — Launch Checklist (Phase 6)

No secrets belong in this file.

## Environment variables
- [x] `.env.example` documents only public `VITE_*` variables.
- [x] `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` set.
- [ ] `VITE_SITE_URL` set to the production origin before publishing.
- [ ] `VITE_GOOGLE_SITE_VERIFICATION` set (optional).
- [x] No service role key or AI key referenced anywhere in `src/`.
- [x] Edge function secrets (`LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) stay server-side.

## Backend security / RLS
- [x] RLS enabled on every forum, notification, report, AI and article table.
- [x] Roles live in a separate `user_roles` table; checks go through `has_role` / `is_forum_mod`.
- [x] Reputation/points are written only by database triggers (`prevent_gamification_updates`).
- [x] Notifications are readable only by their owner; inserts are denied to clients.
- [x] AI summaries/usage logs are not client-writable.
- [ ] TODO: admin bootstrap flow (first admin is granted manually).
- [ ] TODO: review remaining linter warnings about `SECURITY DEFINER` functions executable by `anon`.

## Database indexes (added in Phase 6)
- `idx_forum_topics_created_desc`, `idx_forum_topics_forum_status`,
  `idx_forum_topics_author_created`, `idx_forum_topics_pinned`,
  `idx_forum_topics_featured`, `idx_forum_topics_type`
- `idx_forum_replies_topic_created`
- `idx_forum_topic_tags_tag`, `idx_forum_tags_usage`
- `idx_forum_bookmarks_topic`
- `idx_forum_reports_reporter`, `idx_forum_reports_topic`, `idx_forum_reports_reply`
- `idx_knowledge_articles_created`, `idx_knowledge_articles_status_updated`
- `idx_ai_usage_user_action_created`

Existing coverage kept: topic/forum/author/activity, replies by topic, votes by
topic/reply, bookmarks by user, notifications by `(user_id, is_read, created_at)`.

## Data integrity
- [x] `forum_votes.value` limited to `1` / `-1`.
- [x] A vote targets a topic **or** a reply, never both.
- [x] Unique bookmark per `(user_id, topic_id)`; unique vote per user/target.
- [x] Unique topic tag pair; unique tag/forum/category slugs.
- [x] AI summary cache unique per `(topic_id, input_hash)`.
- [x] New: a report must target exactly one of topic/reply (`NOT VALID` so legacy rows are untouched).

## Build
- Build command: `npm run build` (runs `scripts/generate-sitemap.ts` first).
- [x] TypeScript check passes with no errors.
- [x] No broken route imports; all routes lazy-loaded via `React.lazy`.

## SEO
- [x] `public/robots.txt` allows public content, blocks `/auth`, `/profile`,
      `/settings`, `/messages`, `/bookmarks`, `/notifications`, `/moderation`,
      `/billing`, `/rewards`, `/forums/new`.
- [x] `public/sitemap.xml` generated at build time from published content only.
- [x] `PrivateRouteNoIndex` adds `noindex` to private routes; 404 is noindex.
- [x] Canonical + OG + JSON-LD on public forum, topic, article and tag pages.

## Performance
- [x] Forum topic lists paginated server-side via `range()`.
- [x] Homepage limits latest activity and forum rows.
- [x] React Query caching: 5 min stale, 30 min gc, no refetch-on-focus.
- [x] Realtime channels are per-user / per-conversation and removed on unmount.
- [x] AI runs on explicit user action only, with cached summaries and daily limits.

## Error / loading / empty states
- [x] App-level `ErrorBoundary` with Arabic fallback and retry.
- [x] Loading spinners and skeletons on list pages.
- [x] Arabic empty states across forums, notifications, moderation, articles.
- [x] No stack traces shown in production.

## Route protection
- Public: `/`, `/forums`, `/forums/:slug`, topics, `/knowledge/:id`, `/tags/:slug`,
  `/questions`, `/articles`, `/courses`, `/jobs`, `/leaderboard`, `/developers`, `/u/:id`.
- Authenticated: `/profile`, `/settings`, `/messages`, `/bookmarks`,
  `/notifications`, `/rewards`, `/billing`, `/moderation`, topic/reply/vote actions.
- Moderator/admin: `/moderation` and pin/lock/feature/delete actions, enforced by RLS.

## Mobile QA
- [ ] Guest homepage, forum hub, forum page, topic page, create topic,
      notifications, moderation, article and tag pages checked at 375px.
- [ ] Bottom navigation does not cover primary actions.

## Backup / export
- [ ] Confirm managed backups are enabled before launch.
- [ ] Export a snapshot of `forum_*`, `profiles`, `knowledge_articles` before major migrations.

## Known TODOs for Phase 7
- Proper backend rate limiting primitive (topic/reply/report cooldowns are soft today).
- External error monitoring integration (hook exists in `ErrorBoundary`).
- SSR for accurate social previews (would require migrating the template).
- Full-text search indexes for topics/articles.
- Admin UI for granting moderator/admin roles.