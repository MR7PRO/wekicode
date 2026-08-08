/**
 * Lightweight, vendor-agnostic product analytics.
 *
 * Privacy rules (enforced here, not by callers):
 * - Never send post/message/topic content, emails, tokens or secrets.
 * - Only IDs, slugs, enums, counts and booleans are allowed as properties.
 * - No-ops silently when analytics is not configured.
 */

export type AnalyticsEvent =
  // Onboarding
  | "onboarding_started"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "onboarding_track_selected"
  // Forum
  | "forum_followed"
  | "forum_unfollowed"
  | "tag_followed"
  | "tag_unfollowed"
  | "topic_created"
  | "reply_created"
  | "solution_marked"
  | "vote_cast"
  | "bookmark_added"
  | "report_submitted"
  // AI
  | "ai_suggest_title_clicked"
  | "ai_duplicate_check_clicked"
  | "ai_summary_generated"
  | "ai_answer_draft_generated"
  | "ai_article_draft_created"
  // Retention
  | "achievement_earned"
  | "streak_updated"
  | "leaderboard_viewed"
  | "invite_copied"
  | "invite_used"
  | "nudge_dismissed"
  // Search
  | "forum_search_performed"
  | "tag_page_viewed"
  | "no_results_search"
  // Public / SEO
  | "public_topic_viewed"
  | "article_viewed";

type Primitive = string | number | boolean | null | undefined;
export type AnalyticsProps = Record<string, Primitive>;

/** Property keys that must never leave the browser. */
const BLOCKED_KEYS = [
  "content", "body", "message", "text", "email", "password",
  "token", "key", "secret", "phone", "excerpt", "title",
];

const MAX_STRING = 120;

function sanitize(props?: AnalyticsProps): AnalyticsProps {
  if (!props) return {};
  const out: AnalyticsProps = {};
  for (const [k, v] of Object.entries(props)) {
    const lower = k.toLowerCase();
    if (BLOCKED_KEYS.some((b) => lower.includes(b))) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "string") {
      out[k] = v.slice(0, MAX_STRING);
    } else if (typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    }
  }
  return out;
}

type Gtag = (command: string, ...args: unknown[]) => void;

function getGtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof g === "function" ? g : null;
}

export function isAnalyticsEnabled(): boolean {
  return !!getGtag();
}

/** Track a product event. Safe to call anywhere; never throws. */
export function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProps): void {
  try {
    const props = sanitize(properties);
    const gtag = getGtag();
    if (gtag) {
      gtag("event", event, props);
      return;
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[analytics:noop]", event, props);
    }
  } catch {
    /* analytics must never break the app */
  }
}

/** Track a page/route view. */
export function trackPageView(path: string): void {
  const gtag = getGtag();
  if (gtag) gtag("event", "page_view", { page_path: path.slice(0, MAX_STRING) });
}