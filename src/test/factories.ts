/**
 * Deterministic test factories. No random values — reliable assertions matter more
 * than variety. Every factory accepts partial overrides.
 */
import type {
  SellerLevelStatus, VerificationSummary, AccountRestriction, AccountAppeal,
  ProfessionalVerificationRequest, SupportTicket,
} from "@/lib/trust/types";

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const TEST_IDS = {
  userA: ID(1), userB: ID(2), moderator: ID(3), admin: ID(4),
  topic: ID(10), reply: ID(11), service: ID(20), project: ID(21),
  proposal: ID(22), order: ID(23), review: ID(24), ticket: ID(25),
};

const NOW = "2026-01-01T00:00:00.000Z";

export function createTestUser(o: Partial<{ id: string; email: string }> = {}) {
  return { id: TEST_IDS.userA, email: "user-a@example.test", ...o };
}

export function createTestProfile(o: Record<string, unknown> = {}) {
  return {
    id: ID(100), user_id: TEST_IDS.userA, full_name: "مستخدم تجريبي", username: "test_user",
    avatar_url: null, bio: null, skills: ["React", "TypeScript"], level: 3, points: 350,
    badges: [], current_streak: 2, longest_streak: 5, created_at: NOW, ...o,
  };
}

export function createTestCategory(o: Record<string, unknown> = {}) {
  return { id: ID(200), slug: "web", title: "تطوير الويب", description: null, icon: null, display_order: 1, ...o };
}

export function createTestForum(o: Record<string, unknown> = {}) {
  return { id: ID(201), slug: "frontend", name: "الواجهات الأمامية", description: null, topics_count: 0, ...o };
}

export function createTestTopic(o: Record<string, unknown> = {}) {
  return {
    id: TEST_IDS.topic, forum_id: ID(201), author_id: TEST_IDS.userA, title: "سؤال تجريبي عن React",
    content: "محتوى تجريبي", status: "open", is_locked: false, is_hidden: false, solved_reply_id: null,
    score: 0, replies_count: 0, views_count: 0, tags: ["react"], created_at: NOW, ...o,
  };
}

export function createTestReply(o: Record<string, unknown> = {}) {
  return { id: TEST_IDS.reply, topic_id: TEST_IDS.topic, author_id: TEST_IDS.userB, content: "إجابة تجريبية", score: 0, is_solution: false, created_at: NOW, ...o };
}

export function createTestTag(o: Record<string, unknown> = {}) {
  return { id: ID(210), slug: "react", name: "React", topics_count: 3, ...o };
}

export function createTestNotification(o: Record<string, unknown> = {}) {
  return { id: ID(220), user_id: TEST_IDS.userA, type: "reply", title: "رد جديد", body: null, is_read: false, created_at: NOW, ...o };
}

export function createTestService(o: Record<string, unknown> = {}) {
  return {
    id: TEST_IDS.service, seller_id: TEST_IDS.userA, category_id: ID(200), title: "تطوير واجهة موقع",
    description: "وصف تجريبي للخدمة", status: "draft", is_featured: false, base_price: 100,
    currency: "ILS", rating_avg: 0, rating_count: 0, orders_count: 0, created_at: NOW, ...o,
  };
}

export function createTestProject(o: Record<string, unknown> = {}) {
  return {
    id: TEST_IDS.project, buyer_id: TEST_IDS.userB, category_id: ID(200), title: "مطلوب متجر إلكتروني",
    description: "وصف تجريبي للمشروع", status: "open", budget_min: 200, budget_max: 800,
    currency: "ILS", proposals_count: 0, skills: ["react"], created_at: NOW, ...o,
  };
}

export function createTestProposal(o: Record<string, unknown> = {}) {
  return { id: TEST_IDS.proposal, project_id: TEST_IDS.project, freelancer_id: TEST_IDS.userA, cover_letter: "عرض تجريبي", amount: 500, delivery_days: 7, status: "submitted", created_at: NOW, ...o };
}

export function createTestOrder(o: Record<string, unknown> = {}) {
  return {
    id: TEST_IDS.order, buyer_id: TEST_IDS.userB, seller_id: TEST_IDS.userA, service_id: TEST_IDS.service,
    project_id: null, status: "pending", amount: 500, platform_fee: 25, currency: "ILS",
    payment_status: "pending", created_at: NOW, ...o,
  };
}

export function createTestReview(o: Record<string, unknown> = {}) {
  return { id: TEST_IDS.review, order_id: TEST_IDS.order, reviewer_id: TEST_IDS.userB, reviewee_id: TEST_IDS.userA, rating: 5, comment: "عمل ممتاز", is_public: true, is_hidden: false, created_at: NOW, ...o };
}

export function createTestReport(o: Record<string, unknown> = {}) {
  return { id: ID(230), reporter_id: TEST_IDS.userB, target_type: "topic", target_id: TEST_IDS.topic, reason: "spam", status: "pending", created_at: NOW, ...o };
}

export function createTestDispute(o: Record<string, unknown> = {}) {
  return { id: ID(231), order_id: TEST_IDS.order, opened_by: TEST_IDS.userB, reason: "late_delivery", status: "open", created_at: NOW, ...o };
}

export function createTestSellerLevel(o: Partial<SellerLevelStatus> = {}): SellerLevelStatus {
  return {
    user_id: TEST_IDS.userA, current_level: "new", trust_score: 50, has_enough_data: false,
    completed_orders_count: 0, cancelled_orders_count: 0, disputed_orders_count: 0,
    on_time_delivery_rate: 0, response_rate: 0, average_rating: 0, reviews_count: 0,
    last_calculated_at: NOW, next_level_progress: {}, ...o,
  };
}

export function createTestVerificationSummary(o: Partial<VerificationSummary> = {}): VerificationSummary {
  return {
    user_id: TEST_IDS.userA, email_verified: true, phone_verified: false,
    professional_verified: false, identity_verified: false, payment_verified: false, ...o,
  };
}

export function createTestProRequest(o: Partial<ProfessionalVerificationRequest> = {}): ProfessionalVerificationRequest {
  return {
    id: ID(240), user_id: TEST_IDS.userA, status: "submitted", portfolio_links: ["https://example.test"],
    work_samples: [], skills: ["react", "node", "sql"], notes: null, standards_accepted: true,
    submitted_at: NOW, reviewed_at: null, created_at: NOW, updated_at: NOW, ...o,
  };
}

export function createTestRestriction(o: Partial<AccountRestriction> = {}): AccountRestriction {
  return {
    id: ID(250), user_id: TEST_IDS.userA, restriction_type: "warning", scope: "account",
    reason_code: "policy", public_message: "تنبيه", starts_at: NOW, ends_at: null,
    is_active: true, created_at: NOW, ...o,
  };
}

export function createTestAppeal(o: Partial<AccountAppeal> = {}): AccountAppeal {
  return { id: ID(251), restriction_id: ID(250), explanation: "شرح الاعتراض", status: "submitted", reviewer_response: null, submitted_at: NOW, reviewed_at: null, ...o };
}

export function createTestTicket(o: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: TEST_IDS.ticket, user_id: TEST_IDS.userA, category: "account", subject: "استفسار",
    description: "وصف", status: "open", priority: "normal", created_at: NOW, updated_at: NOW,
    ...(o as Record<string, unknown>),
  } as SupportTicket;
}
