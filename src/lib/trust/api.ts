import { supabase } from "@/integrations/supabase/client";
import type {
  UserVerification, VerificationSummary, ProfessionalVerificationRequest,
  SellerLevelStatus, TrustScoreEvent, AccountRestriction, AccountAppeal,
  HelpArticle, SupportTicket, SupportTicketMessage, LegalDocument,
  PrivacyPreferences,
} from "./types";

// Phase 10 tables are not in the generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/* ---------------- verifications ---------------- */
export async function fetchMyVerifications(userId: string): Promise<UserVerification[]> {
  const { data } = await db.from("user_verifications").select("*").eq("user_id", userId);
  return data ?? [];
}

export async function fetchVerificationSummary(userId: string): Promise<VerificationSummary | null> {
  const { data } = await db.from("public_profile_verification_summary")
    .select("*").eq("user_id", userId).maybeSingle();
  return data ?? null;
}

/* ---------------- professional verification ---------------- */
export async function fetchMyProRequest(userId: string): Promise<ProfessionalVerificationRequest | null> {
  const { data } = await db.from("professional_verification_requests")
    .select("id, user_id, status, portfolio_links, work_samples, skills, notes, standards_accepted, submitted_at, reviewed_at, created_at, updated_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data ?? null;
}

export async function submitProRequest(
  userId: string,
  payload: { portfolio_links: string[]; work_samples: string[]; skills: string[]; notes: string; standards_accepted: boolean },
  existingId?: string,
) {
  const row = { ...payload, status: "submitted", submitted_at: new Date().toISOString() };
  if (existingId) {
    const { error } = await db.from("professional_verification_requests").update(row).eq("id", existingId);
    if (error) throw error;
    return;
  }
  const { error } = await db.from("professional_verification_requests").insert({ ...row, user_id: userId });
  if (error) throw error;
}

/* ---------------- seller level & trust ---------------- */
export async function fetchSellerLevel(userId: string): Promise<SellerLevelStatus | null> {
  const { data } = await db.from("seller_level_status").select("*").eq("user_id", userId).maybeSingle();
  return data ?? null;
}

export async function recalculateTrust(userId: string) {
  await db.rpc("recalculate_seller_trust", { p_user_id: userId });
}

export async function fetchTrustEvents(userId: string, limit = 20): Promise<TrustScoreEvent[]> {
  const { data } = await db.from("trust_score_events")
    .select("id, event_type, points_change, reason, created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

/* ---------------- restrictions & appeals ---------------- */
export async function fetchMyRestrictions(userId: string): Promise<AccountRestriction[]> {
  const { data } = await db.from("account_restrictions").select("*")
    .eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchMyAppeals(userId: string): Promise<AccountAppeal[]> {
  const { data } = await db.from("account_appeals")
    .select("id, restriction_id, explanation, status, reviewer_response, submitted_at, reviewed_at")
    .eq("user_id", userId).order("submitted_at", { ascending: false });
  return data ?? [];
}

export async function submitAppeal(userId: string, restrictionId: string | null, explanation: string) {
  const { error } = await db.from("account_appeals")
    .insert({ user_id: userId, restriction_id: restrictionId, explanation, status: "submitted" });
  if (error) throw error;
}

/* ---------------- help center ---------------- */
export async function fetchHelpArticles(category?: string, search?: string): Promise<HelpArticle[]> {
  let q = db.from("help_articles")
    .select("id, slug, category, title, excerpt, content, display_order, published_at, updated_at")
    .eq("status", "published");
  if (category) q = q.eq("category", category);
  if (search) q = q.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  const { data } = await q.order("display_order").limit(100);
  return data ?? [];
}

export async function fetchHelpArticle(slug: string): Promise<HelpArticle | null> {
  const { data } = await db.from("help_articles").select("*")
    .eq("slug", slug).eq("status", "published").maybeSingle();
  return data ?? null;
}

export async function sendHelpFeedback(articleId: string, userId: string, wasHelpful: boolean) {
  await db.from("help_article_feedback").insert({ article_id: articleId, user_id: userId, was_helpful: wasHelpful });
}

/* ---------------- support ---------------- */
export async function fetchMyTickets(userId: string): Promise<SupportTicket[]> {
  const { data } = await db.from("support_tickets").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchTicket(id: string): Promise<SupportTicket | null> {
  const { data } = await db.from("support_tickets").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function fetchTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
  const { data } = await db.from("support_ticket_messages")
    .select("id, ticket_id, sender_id, sender_type, message, created_at")
    .eq("ticket_id", ticketId).order("created_at");
  return data ?? [];
}

export async function createTicket(userId: string, payload: { category: string; subject: string; description: string }) {
  const { data, error } = await db.from("support_tickets")
    .insert({ ...payload, user_id: userId, status: "open", priority: "normal" })
    .select("id").single();
  if (error) throw error;
  return data as { id: string };
}

export async function replyToTicket(ticketId: string, senderId: string, message: string) {
  const { error } = await db.from("support_ticket_messages")
    .insert({ ticket_id: ticketId, sender_id: senderId, sender_type: "user", message, is_internal_note: false });
  if (error) throw error;
}

/* ---------------- legal ---------------- */
export async function fetchLegalDocuments(): Promise<LegalDocument[]> {
  const { data } = await db.from("legal_documents").select("*")
    .eq("status", "published").order("document_key");
  return data ?? [];
}

export async function fetchLegalDocument(key: string): Promise<LegalDocument | null> {
  const { data } = await db.from("legal_documents").select("*")
    .eq("document_key", key).eq("status", "published")
    .order("published_at", { ascending: false }).limit(1).maybeSingle();
  return data ?? null;
}

export async function recordConsent(userId: string, documentKey: string, version: string, source = "web") {
  await db.from("user_legal_consents")
    .insert({ user_id: userId, document_key: documentKey, document_version: version, source });
}

/* ---------------- privacy / data ---------------- */
export async function fetchPrivacyPreferences(userId: string): Promise<PrivacyPreferences | null> {
  const { data } = await db.from("user_privacy_preferences").select("*").eq("user_id", userId).maybeSingle();
  return data ?? null;
}

export async function savePrivacyPreferences(userId: string, patch: Partial<PrivacyPreferences>) {
  const { error } = await db.from("user_privacy_preferences")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function fetchExportRequests(userId: string) {
  const { data } = await db.from("data_export_requests").select("*")
    .eq("user_id", userId).order("requested_at", { ascending: false }).limit(5);
  return (data ?? []) as { id: string; status: string; requested_at: string; completed_at: string | null }[];
}

export async function requestDataExport(userId: string) {
  const { error } = await db.from("data_export_requests").insert({ user_id: userId, status: "requested" });
  if (error) throw error;
}

export async function fetchDeletionRequest(userId: string) {
  const { data } = await db.from("account_deletion_requests").select("*")
    .eq("user_id", userId).not("status", "in", "(cancelled,completed)")
    .order("requested_at", { ascending: false }).limit(1).maybeSingle();
  return (data ?? null) as { id: string; status: string; scheduled_for: string | null; requested_at: string } | null;
}

export async function requestAccountDeletion(userId: string, reason: string) {
  const { count } = await db.from("marketplace_orders")
    .select("id", { count: "exact", head: true })
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .in("status", ["pending", "accepted", "in_progress", "submitted", "revision_requested", "disputed"]);
  const blocked = (count ?? 0) > 0;
  const scheduled = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  const { error } = await db.from("account_deletion_requests").insert({
    user_id: userId,
    reason,
    status: blocked ? "blocked_pending_orders" : "scheduled",
    scheduled_for: blocked ? null : scheduled,
  });
  if (error) throw error;
  return { blocked };
}

export async function cancelAccountDeletion(id: string) {
  const { error } = await db.from("account_deletion_requests")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}