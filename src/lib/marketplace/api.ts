import { supabase } from "@/integrations/supabase/client";
import type {
  MarketplaceCategory, MarketplaceService, ServicePackage, ProjectRequest,
  ProjectProposal, MarketplaceOrder, OrderMessage, OrderDeliverable,
  MarketplaceReview, SellerMini, ServiceFilters, FreelancerFilters,
} from "./types";

// New tables are not in the generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const SELLER_FIELDS =
  "user_id, full_name, username, avatar_url, headline, freelancer_role, level, points, skills, availability_status, marketplace_verified, marketplace_rating_avg, marketplace_rating_count, completed_orders_count";

async function attachProfiles<T extends Record<string, unknown>>(
  rows: T[],
  idKey: string,
  target: string,
): Promise<T[]> {
  const ids = [...new Set(rows.map((r) => r[idKey]).filter(Boolean))] as string[];
  if (ids.length === 0) return rows;
  const { data } = await db.from("profiles").select(SELLER_FIELDS).in("user_id", ids);
  const map = new Map<string, SellerMini>((data ?? []).map((p: SellerMini) => [p.user_id, p]));
  return rows.map((r) => ({ ...r, [target]: map.get(r[idKey] as string) ?? null }));
}

/* ---------------- categories ---------------- */
export async function fetchCategories(): Promise<MarketplaceCategory[]> {
  const { data, error } = await db
    .from("marketplace_categories")
    .select("id, slug, title, description, icon, display_order")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

/* ---------------- services ---------------- */
export async function fetchServices(filters: ServiceFilters = {}, limit = 24): Promise<MarketplaceService[]> {
  let q = db.from("marketplace_services").select("*").eq("status", "active");

  if (filters.q) q = q.or(`title.ilike.%${filters.q}%,short_description.ilike.%${filters.q}%`);
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.tags?.length) q = q.overlaps("tags", filters.tags);
  if (filters.minPrice != null) q = q.gte("base_price", filters.minPrice);
  if (filters.maxPrice != null) q = q.lte("base_price", filters.maxPrice);
  if (filters.minRating != null) q = q.gte("rating_avg", filters.minRating);
  if (filters.maxDeliveryDays != null) q = q.lte("delivery_days", filters.maxDeliveryDays);

  switch (filters.sort) {
    case "newest": q = q.order("created_at", { ascending: false }); break;
    case "price_asc": q = q.order("base_price", { ascending: true }); break;
    case "price_desc": q = q.order("base_price", { ascending: false }); break;
    case "fastest": q = q.order("delivery_days", { ascending: true }); break;
    case "popular": q = q.order("orders_count", { ascending: false }); break;
    default: q = q.order("rating_avg", { ascending: false }).order("orders_count", { ascending: false });
  }

  const { data, error } = await q.limit(limit);
  if (error) throw error;
  return attachProfiles(data ?? [], "seller_id", "seller");
}

export async function fetchFeaturedServices(limit = 6): Promise<MarketplaceService[]> {
  const { data, error } = await db
    .from("marketplace_services").select("*").eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachProfiles(data ?? [], "seller_id", "seller");
}

export async function fetchServiceById(idOrSlug: string): Promise<MarketplaceService | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
  const { data, error } = await db
    .from("marketplace_services").select("*")
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle();
  if (error || !data) return null;
  const [withSeller] = await attachProfiles([data], "seller_id", "seller");
  if (data.category_id) {
    const { data: cat } = await db.from("marketplace_categories")
      .select("id, slug, title, description, icon, display_order").eq("id", data.category_id).maybeSingle();
    withSeller.category = cat ?? null;
  }
  return withSeller as MarketplaceService;
}

export async function fetchMyServices(userId: string): Promise<MarketplaceService[]> {
  const { data, error } = await db.from("marketplace_services").select("*")
    .eq("seller_id", userId).order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchServicesBySeller(sellerId: string): Promise<MarketplaceService[]> {
  const { data, error } = await db.from("marketplace_services").select("*")
    .eq("seller_id", sellerId).eq("status", "active").order("rating_avg", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function slugifyTitle(title: string): string {
  const base = title.trim().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `${base || "service"}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createService(payload: Partial<MarketplaceService> & { seller_id: string; title: string; description: string }) {
  const { data, error } = await db.from("marketplace_services")
    .insert({ ...payload, slug: payload.slug || slugifyTitle(payload.title) })
    .select("id, slug").single();
  if (error) throw error;
  return data;
}

export async function updateService(id: string, patch: Partial<MarketplaceService>) {
  const { error } = await db.from("marketplace_services").update(patch).eq("id", id);
  if (error) throw error;
}

export async function incrementServiceViews(id: string) {
  await db.rpc("increment_service_views", { p_service_id: id });
}

export async function fetchServicePackages(serviceId: string): Promise<ServicePackage[]> {
  const { data } = await db.from("marketplace_service_packages").select("*")
    .eq("service_id", serviceId).order("display_order");
  return data ?? [];
}

/* ---------------- freelancers ---------------- */
export async function fetchFreelancers(filters: FreelancerFilters = {}, limit = 24): Promise<SellerMini[]> {
  let q = db.from("profiles").select(SELLER_FIELDS)
    .eq("marketplace_enabled", true).eq("is_public", true);
  if (filters.q) q = q.or(`full_name.ilike.%${filters.q}%,headline.ilike.%${filters.q}%,freelancer_role.ilike.%${filters.q}%`);
  if (filters.skills?.length) q = q.overlaps("skills", filters.skills);
  if (filters.availability) q = q.eq("availability_status", filters.availability);
  if (filters.minRating != null) q = q.gte("marketplace_rating_avg", filters.minRating);
  if (filters.language) q = q.contains("languages", [filters.language]);

  if (filters.sort === "contributions") q = q.order("points", { ascending: false });
  else if (filters.sort === "newest") q = q.order("created_at", { ascending: false });
  else q = q.order("marketplace_rating_avg", { ascending: false }).order("points", { ascending: false });

  const { data, error } = await q.limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfileByUsernameOrId(key: string): Promise<Record<string, unknown> | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(key);
  const { data } = await db.from("profiles").select("*")
    .eq(isUuid ? "user_id" : "username", key).maybeSingle();
  return data ?? null;
}

/* ---------------- projects ---------------- */
export async function fetchProjects(opts: { q?: string; categoryId?: string; status?: string; skills?: string[] } = {}, limit = 30): Promise<ProjectRequest[]> {
  let q = db.from("project_requests").select("*").eq("visibility", "public");
  q = opts.status ? q.eq("status", opts.status) : q.in("status", ["open", "reviewing"]);
  if (opts.q) q = q.ilike("title", `%${opts.q}%`);
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.skills?.length) q = q.overlaps("skills_required", opts.skills);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return attachProfiles(data ?? [], "buyer_id", "buyer");
}

export async function fetchProjectById(id: string): Promise<ProjectRequest | null> {
  const { data } = await db.from("project_requests").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const [row] = await attachProfiles([data], "buyer_id", "buyer");
  return row as ProjectRequest;
}

export async function fetchMyProjects(userId: string): Promise<ProjectRequest[]> {
  const { data } = await db.from("project_requests").select("*")
    .eq("buyer_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function createProject(payload: Record<string, unknown>) {
  const { data, error } = await db.from("project_requests").insert(payload).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, patch: Record<string, unknown>) {
  const { error } = await db.from("project_requests").update(patch).eq("id", id);
  if (error) throw error;
}

/* ---------------- proposals ---------------- */
export async function fetchProposalsForProject(projectId: string): Promise<ProjectProposal[]> {
  const { data } = await db.from("project_proposals").select("*")
    .eq("project_id", projectId).order("created_at", { ascending: false });
  return attachProfiles(data ?? [], "freelancer_id", "freelancer");
}

export async function fetchMyProposals(userId: string): Promise<ProjectProposal[]> {
  const { data } = await db.from("project_proposals").select("*")
    .eq("freelancer_id", userId).order("created_at", { ascending: false });
  const rows = data ?? [];
  const ids = [...new Set(rows.map((r: ProjectProposal) => r.project_id))];
  if (!ids.length) return rows;
  const { data: projects } = await db.from("project_requests").select("id, title, status").in("id", ids);
  const map = new Map((projects ?? []).map((p: { id: string }) => [p.id, p]));
  return rows.map((r: ProjectProposal) => ({ ...r, project: map.get(r.project_id) ?? null }));
}

export async function submitProposal(payload: Record<string, unknown>) {
  const { error } = await db.from("project_proposals").insert(payload);
  if (error) throw error;
}

export async function updateProposalStatus(id: string, status: string) {
  const { error } = await db.from("project_proposals").update({ status }).eq("id", id);
  if (error) throw error;
}

/* ---------------- orders ---------------- */
export async function createOrder(payload: Record<string, unknown>) {
  const { data, error } = await db.from("marketplace_orders").insert(payload).select("id").single();
  if (error) throw error;
  return data;
}

export async function fetchMyOrders(userId: string): Promise<MarketplaceOrder[]> {
  const { data, error } = await db.from("marketplace_orders").select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const withBuyer = await attachProfiles(data ?? [], "buyer_id", "buyer");
  return attachProfiles(withBuyer, "seller_id", "seller") as Promise<MarketplaceOrder[]>;
}

export async function fetchOrderById(id: string): Promise<MarketplaceOrder | null> {
  const { data } = await db.from("marketplace_orders").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const withBuyer = await attachProfiles([data], "buyer_id", "buyer");
  const [row] = await attachProfiles(withBuyer, "seller_id", "seller");
  return row as MarketplaceOrder;
}

export async function updateOrderStatus(id: string, status: string) {
  const { error } = await db.from("marketplace_orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function fetchOrderMessages(orderId: string): Promise<OrderMessage[]> {
  const { data } = await db.from("order_messages").select("*")
    .eq("order_id", orderId).order("created_at");
  return data ?? [];
}

export async function sendOrderMessage(orderId: string, senderId: string, message: string) {
  const { error } = await db.from("order_messages").insert({ order_id: orderId, sender_id: senderId, message });
  if (error) throw error;
}

export async function fetchDeliverables(orderId: string): Promise<OrderDeliverable[]> {
  const { data } = await db.from("order_deliverables").select("*")
    .eq("order_id", orderId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function submitDeliverable(payload: Record<string, unknown>) {
  const { error } = await db.from("order_deliverables").insert(payload);
  if (error) throw error;
}

/* ---------------- reviews ---------------- */
export async function fetchReviews(opts: { serviceId?: string; revieweeId?: string }, limit = 20): Promise<MarketplaceReview[]> {
  let q = db.from("marketplace_reviews").select("*").eq("is_public", true).eq("is_hidden", false);
  if (opts.serviceId) q = q.eq("service_id", opts.serviceId);
  if (opts.revieweeId) q = q.eq("reviewee_id", opts.revieweeId);
  const { data } = await q.order("created_at", { ascending: false }).limit(limit);
  return attachProfiles(data ?? [], "reviewer_id", "reviewer");
}

export async function fetchMyReviewForOrder(orderId: string, reviewerId: string) {
  const { data } = await db.from("marketplace_reviews").select("id")
    .eq("order_id", orderId).eq("reviewer_id", reviewerId).maybeSingle();
  return data;
}

export async function createReview(payload: Record<string, unknown>) {
  const { error } = await db.from("marketplace_reviews").insert(payload);
  if (error) throw error;
}

/* ---------------- disputes & reports ---------------- */
export async function openDispute(payload: Record<string, unknown>) {
  const { error } = await db.from("marketplace_disputes").insert(payload);
  if (error) throw error;
}

export async function fetchDisputeForOrder(orderId: string) {
  const { data } = await db.from("marketplace_disputes").select("*")
    .eq("order_id", orderId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function reportMarketplaceTarget(payload: Record<string, unknown>) {
  const { error } = await db.from("marketplace_reports").insert(payload);
  if (error) throw error;
}

/* ---------------- moderation ---------------- */
export async function fetchPendingServices(): Promise<MarketplaceService[]> {
  const { data } = await db.from("marketplace_services").select("*")
    .eq("status", "pending_review").order("created_at");
  return attachProfiles(data ?? [], "seller_id", "seller");
}

export async function fetchMarketplaceReports() {
  const { data } = await db.from("marketplace_reports").select("*")
    .eq("status", "pending").order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchOpenDisputes() {
  const { data } = await db.from("marketplace_disputes").select("*")
    .in("status", ["open", "under_review"]).order("created_at", { ascending: false });
  return data ?? [];
}

export async function moderateService(id: string, status: string, note?: string) {
  const { error } = await db.from("marketplace_services")
    .update({ status, moderation_note: note ?? null }).eq("id", id);
  if (error) throw error;
}

export async function resolveReport(id: string, status: string, reviewerId: string) {
  const { error } = await db.from("marketplace_reports")
    .update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function resolveDispute(id: string, status: string, resolution: string, reviewerId: string) {
  const { error } = await db.from("marketplace_disputes")
    .update({ status, resolution, resolved_by: reviewerId, resolved_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

/* ---------------- fees ---------------- */
export async function fetchActiveFeeRule(): Promise<{ percentage: number; fixed_fee: number; currency: string } | null> {
  const { data } = await db.from("platform_fee_rules").select("percentage, fixed_fee, currency")
    .eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data ?? null;
}